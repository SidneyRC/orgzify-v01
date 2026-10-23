// THIS FILE GOES IN: app/biz/events/eventvenue/bookingmethod/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { checkEventAccess } from '@/lib/eventAccess'
import { bookingOptionsProblem, bookingUrlFormatProblem } from '@/lib/bookingMethodRules'

// A refused person is told the event "cannot be found", never "not allowed".
const noEvent = () => NextResponse.json({ error: 'Event not found' }, { status: 404 })

async function flagPendingEditsIfActive(eventId: string) {
  const { data: event } = await supabaseAdmin.from('events').select('status').eq('id', eventId).maybeSingle()
  if (event?.status === 'active') await supabaseAdmin.from('events').update({ has_pending_edits: true }).eq('id', eventId)
}

// True when every session id belongs to this event (a link can never be saved on another event's session).
async function timesBelong(eventId: string, timeIds: string[]) {
  if (!timeIds || timeIds.length === 0) return true
  const { data } = await supabaseAdmin.from('event_venues').select('event_venue_dates(event_venue_times(id))').eq('event_id', eventId)
  const ok = new Set<string>()
  for (const v of (data || []) as any[]) for (const d of v.event_venue_dates || []) for (const t of d.event_venue_times || []) ok.add(t.id)
  return timeIds.every(id => ok.has(id))
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  if (!(await checkEventAccess(req, session, { eventId }, 'view')).ok) return noEvent()

  const { data: method } = await supabaseAdmin.from('event_booking_methods').select('*').eq('event_id', eventId).maybeSingle()
  const { data: upi } = await supabaseAdmin.from('event_booking_upi').select('*').eq('event_id', eventId)
  const { data: venues } = await supabaseAdmin
    .from('event_venues')
    .select('id, venues(external_name), event_venue_dates(id, event_date, event_venue_times(id, start_time, event_venue_time_urls(booking_url)))')
    .eq('event_id', eventId)

  return NextResponse.json({ data: method || null, upi: upi || [], venues: venues || [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json()
  const { event_id, fields, upi, timeUrls } = body
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  if (!(await checkEventAccess(req, session, { eventId: event_id }, 'edit')).ok) return noEvent()
  if (!(await timesBelong(event_id, (timeUrls || []).map((t: any) => t.event_venue_time_id)))) return noEvent()

  if (fields?.bank_account_number && /\D/.test(String(fields.bank_account_number))) return NextResponse.json({ error: 'Account number must have digits only' }, { status: 400 })
  const optionProblem = bookingOptionsProblem(fields)
  if (optionProblem) return NextResponse.json({ error: optionProblem }, { status: 400 })
  const urlProblem = bookingUrlFormatProblem(fields, (timeUrls || []).map((t: any) => t.booking_url))
  if (urlProblem) return NextResponse.json({ error: urlProblem }, { status: 400 })

  // The checked event id always comes AFTER anything sent by the browser.
  const { id: _rowId, ...safeFields } = fields || {}
  const { data: saved, error } = await supabaseAdmin
    .from('event_booking_methods')
    .upsert({ ...safeFields, event_id, updated_at: new Date().toISOString() }, { onConflict: 'event_id' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('event_booking_upi').delete().eq('event_id', event_id)
  if (upi?.length > 0) await supabaseAdmin.from('event_booking_upi').insert(upi.map((u: any) => ({ ...u, event_id })))

  if (timeUrls?.length > 0) {
    for (const t of timeUrls) {
      const { error: urlError } = await supabaseAdmin.from('event_venue_time_urls').upsert({ event_venue_time_id: t.event_venue_time_id, booking_url: t.booking_url }, { onConflict: 'event_venue_time_id' })
      if (urlError) return NextResponse.json({ error: `Failed to save URL for one slot: ${urlError.message}` }, { status: 500 })
    }
  }
  await flagPendingEditsIfActive(event_id)
  return NextResponse.json({ data: saved })
}
