// THIS FILE GOES IN: app/biz/events/eventvenue/bookingmethod/api/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  const { data: method } = await supabaseAdmin.from('event_booking_methods').select('*').eq('event_id', eventId).maybeSingle()
  const { data: upi } = await supabaseAdmin.from('event_booking_upi').select('*').eq('event_id', eventId)
  const { data: venues } = await supabaseAdmin
    .from('event_venues')
    .select('id, venues(external_name), event_venue_dates(id, event_date, event_venue_times(id, start_time, event_venue_time_urls(booking_url)))')
    .eq('event_id', eventId)  

  return NextResponse.json({ data: method || null, upi: upi || [], venues: venues || [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { event_id, fields, upi, timeUrls } = body
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  const { data: saved, error } = await supabaseAdmin
    .from('event_booking_methods')
    .upsert({ event_id, ...fields, updated_at: new Date().toISOString() }, { onConflict: 'event_id' })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('event_booking_upi').delete().eq('event_id', event_id)
  if (upi?.length > 0) await supabaseAdmin.from('event_booking_upi').insert(upi.map((u: any) => ({ event_id, ...u })))

  if (timeUrls?.length > 0) {
    for (const t of timeUrls) {
      const { error: urlError } = await supabaseAdmin.from('event_venue_time_urls').upsert({ event_venue_time_id: t.event_venue_time_id, booking_url: t.booking_url }, { onConflict: 'event_venue_time_id' })
      if (urlError) return NextResponse.json({ error: `Failed to save URL for one slot: ${urlError.message}` }, { status: 500 })
    }
  }
  return NextResponse.json({ data: saved })
}