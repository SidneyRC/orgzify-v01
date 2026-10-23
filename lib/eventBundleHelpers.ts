// THIS FILE GOES IN: lib/eventBundleHelpers.ts (REPLACE EXISTING)
// Shared builders used by buildEventBundle.ts to shape venues, tickets,
// and payment data. Live-only overrides (Quantity/Status/Fast selling)
// now live in lib/eventBundleLiveOverrides.ts.

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { VIRTUAL_VENUE_ID } from '@/lib/constants'

export function buildPayment(bm: any, upiRows: any[], sessionUrls: Record<string, string> = {}) {
  if (!bm) return null
  return {
    upi_enabled: bm.upi_enabled || false, upi: upiRows, qr_enabled: bm.qr_enabled || false,
    qr_image_url: bm.qr_image_url || '', qr_display_name: bm.qr_display_name || '', bank_enabled: bm.bank_enabled || false,
    bank_account_name: bm.bank_account_name || '', bank_account_number: bm.bank_account_number || '',
    bank_name: bm.bank_name || '', bank_ifsc_swift: bm.bank_ifsc_swift || '',
    url_enabled: bm.url_enabled || false, external_url: bm.external_url || '', url_mode: bm.url_mode || 'event', session_urls: sessionUrls,
  }
}

export async function buildVenues(eventVenues: any[]) {
    const venues = []; const cityIds = [...new Set(eventVenues.map((e: any) => e.venues?.city_id).filter(Boolean))]; const { data: cityRows } = cityIds.length ? await supabaseAdmin.from('locations').select('id, name').in('id', cityIds) : { data: [] as any[] }; const cityName = (id: string) => (cityRows || []).find((c: any) => c.id === id)?.name || ''
  for (const ev of eventVenues) {
    const { data: dates } = await supabaseAdmin.from('event_venue_dates').select('id, event_date').eq('event_venue_id', ev.id).order('event_date')
    const datesWithTimes = []
    for (const d of dates || []) {
      const { data: times } = await supabaseAdmin.from('event_venue_times').select('id, start_time, end_time').eq('event_venue_date_id', d.id).order('start_time')
      datesWithTimes.push({ ...d, times: times || [] })
    }
    venues.push({ id: ev.id, is_virtual: ev.venue_id === VIRTUAL_VENUE_ID, external_name: ev.venues?.external_name || '', line1: ev.venues?.line1 || '', area: ev.venues?.area || '', city_name: cityName(ev.venues?.city_id), dates: datesWithTimes })
  }
  return venues
}

// Builds the initial ticketsBySlot for a fresh bundle (used pre-approval and
// when the snapshot itself is rebuilt on approval). Fast selling is read
// from each ASSIGNMENT (per date), not from the shared ticket row — a ticket
// can be fast-selling on one date and not another.
export async function buildTickets(venues: any[], ticketTypes: any[], durationMin: number) {
  const ticketsBySlot: Record<string, any[]> = {}
  const allSlots: { id: string; date: string; time: string }[] = []

  for (const v of venues) {
    for (const d of v.dates) {
      for (const t of d.times) {
        allSlots.push({ id: t.id, date: d.event_date, time: t.start_time })
        const { data: assigned } = await supabaseAdmin.from('event_ticket_assignments').select('price, quantity, sold_count, ticket_type_id, fast_selling_forced').eq('event_venue_time_id', t.id).eq('is_enabled', true)
        ticketsBySlot[t.id] = (assigned || []).map((a: any) => {
          const tt = ticketTypes.find((x: any) => x.id === a.ticket_type_id)
          if (!tt) return null
          const autoFast = a.quantity > 0 && (a.sold_count / a.quantity) >= 0.9
          return { id: a.ticket_type_id, name: tt.name, price: a.price, quantity: a.quantity, soldCount: a.sold_count, fastFilling: !!a.fast_selling_forced || autoFast }
        }).filter(Boolean)
      }
    }
  }

  const GRACE_MIN = 10
  const now = new Date()
  const sorted = [...allSlots].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())
  const slotStatusById: Record<string, { status: 'upcoming' | 'live' | 'past'; locked: boolean }> = {}
  for (const s of sorted) {
    const start = new Date(`${s.date}T${s.time}`)
    const end = new Date(start.getTime() + durationMin * 60000)
    const graceEnd = new Date(start.getTime() + GRACE_MIN * 60000)
    let status: 'upcoming' | 'live' | 'past' = 'upcoming'
    if (now >= end) status = 'past'; else if (now >= start) status = 'live'
    slotStatusById[s.id] = { status, locked: status === 'live' && now >= graceEnd }
  }

  const upcomingSlotIds = sorted.filter(s => slotStatusById[s.id].status !== 'past').map(s => s.id)
  const pastSlotIds = sorted.filter(s => slotStatusById[s.id].status === 'past').map(s => s.id)
  const nextUpcomingSlotId = upcomingSlotIds.find(id => !slotStatusById[id].locked) || upcomingSlotIds[0] || sorted[0]?.id || null

  let lowestActivePrice: number | null = null
  let hasFastFilling = false
  for (const slotId of upcomingSlotIds) {
    for (const t of ticketsBySlot[slotId] || []) {
      if (lowestActivePrice === null || t.price < lowestActivePrice) lowestActivePrice = t.price
      if (t.fastFilling) hasFastFilling = true
    }
  }

  return { ticketsBySlot, nextUpcomingSlotId, upcomingSlotIds, pastSlotIds, lowestActivePrice, hasFastFilling, slotStatusById }
}
