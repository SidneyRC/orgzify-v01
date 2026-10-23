// THIS FILE GOES IN: lib/createBookingProcess.ts (REPLACES the file saved earlier)
// Saves the Processing ID record. Used by the booking-start, booking-choose and booking-go routes.
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { applyLiveEventFilter } from '@/lib/isEventLive'
import { DROP_MINUTES, DOUBLE_TAP_SECONDS, STATUS_PRE, STATUS_DROP, STATUS_CLICKED, isBookingOption, isManualOption } from '@/lib/bookingProcessRules'

// Country code of the event: its first venue with a country, else the organiser's address, else IN.
async function countryCodeOf(event: any): Promise<string> {
  try {
    const { data: rows } = await supabaseAdmin.from('event_venues').select('venues(country_id)').eq('event_id', event.id)
    let countryId = (rows || []).map((r: any) => r.venues?.country_id).find(Boolean)
    if (!countryId && event.entity_id) {
      const { data: addr } = await supabaseAdmin.from('entity_addresses').select('country_id, address_type').eq('entity_id', event.entity_id)
      countryId = ((addr || []).find((a: any) => a.address_type === 'operating') || (addr || [])[0])?.country_id
    }
    if (countryId) {
      const { data: c } = await supabaseAdmin.from('country_master').select('iso2').eq('id', countryId).maybeSingle()
      if (c?.iso2) return String(c.iso2).toUpperCase()
    }
  } catch {}
  return 'IN'
}

// Moves records that waited too long to PreBookDrop. Plain code (no database scheduler), run whenever a booking starts.
export async function settleBookingProcesses() {
  try { await supabaseAdmin.from('booking_processes').update({ status: STATUS_DROP }).eq('status', STATUS_PRE).lt('drop_after', new Date().toISOString()) } catch {}
}

type Start = { userId: string; eventId: string; slotId?: string; option?: string; targetUrl?: string }

// Creates a Processing ID. The same person tapping the same session again within a few seconds gets the SAME one.
export async function startBookingProcess(i: Start): Promise<{ row: any } | { error: string }> {
  const { data: event } = await applyLiveEventFilter(supabaseAdmin.from('events').select('id, entity_id').eq('id', i.eventId)).maybeSingle()
  if (!event) return { error: 'event_not_live' }
  await settleBookingProcesses()
  const slot = i.slotId || null
  const option = isBookingOption(i.option) ? (i.option as string) : null
  const now = Date.now()

  let recent: any = supabaseAdmin.from('booking_processes').select('id, process_code, chosen_option').eq('user_id', i.userId).eq('event_id', i.eventId).gte('created_at', new Date(now - DOUBLE_TAP_SECONDS * 1000).toISOString())
  recent = slot ? recent.eq('event_venue_time_id', slot) : recent.is('event_venue_time_id', null)
  const { data: same } = await recent.order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (same) {
    if (option && !same.chosen_option) await setProcessOption(i.userId, same.id, option, undefined, i.targetUrl)
    return { row: same }
  }

  const country = await countryCodeOf(event)
  const { data: code, error: codeErr } = await supabaseAdmin.rpc('next_process_code', { p_country: country })
  if (codeErr || !code) { console.error('next_process_code error:', codeErr?.message); return { error: 'code_failed' } }
  const { data: row, error } = await supabaseAdmin.from('booking_processes').insert({
    process_code: code, country_code: country, event_id: i.eventId, event_venue_time_id: slot, user_id: i.userId,
    chosen_option: option, target_url: i.targetUrl || null, status: isManualOption(option) || (option && i.targetUrl) ? STATUS_CLICKED : STATUS_PRE,
    option_at: option ? new Date(now).toISOString() : null, drop_after: new Date(now + DROP_MINUTES * 60000).toISOString(),
  }).select('id, process_code, chosen_option').single()
  if (error || !row) { console.error('booking_processes insert error:', error?.message); return { error: 'save_failed' } }
  return { row }
}

// Adds the option the visitor chose to THEIR OWN record. UPI / QR / Bank = Clicked; a link counts as Clicked only when its address is given.
export async function setProcessOption(userId: string, processId: string, option: string, provider?: string, targetUrl?: string): Promise<{ row: any } | { error: string }> {
  if (!isBookingOption(option)) return { error: 'bad_option' }
  const patch: any = { chosen_option: option, provider: provider || null, option_at: new Date().toISOString() }
  if (targetUrl) patch.target_url = targetUrl
  if (targetUrl || isManualOption(option)) patch.status = STATUS_CLICKED
  const { data } = await supabaseAdmin.from('booking_processes').update(patch).eq('id', processId).eq('user_id', userId).select('id, process_code, chosen_option').maybeSingle()
  return data ? { row: data } : { error: 'not_found' }
}
