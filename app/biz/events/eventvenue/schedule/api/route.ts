// THIS FILE GOES IN: app/biz/events/eventvenue/schedule/api/route.ts (REPLACE EXISTING)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { checkEventAccess, type EventSource } from '@/lib/eventAccess'

const denied = () => NextResponse.json({ error: 'Event not found' }, { status: 404 })

async function flagPendingEditsIfActive(eventId: string) {
  const { data: event } = await supabaseAdmin.from('events').select('status').eq('id', eventId).maybeSingle()
  if (event?.status === 'active') await supabaseAdmin.from('events').update({ has_pending_edits: true }).eq('id', eventId)
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const eventVenueId = req.nextUrl.searchParams.get('event_venue_id')
  if (!eventVenueId) return NextResponse.json({ error: 'Missing event_venue_id' }, { status: 400 })
  if (!(await checkEventAccess(req, session, { eventVenueId }, 'view')).ok) return denied()

  const { data: dates } = await supabaseAdmin
    .from('event_venue_dates')
    .select('id, event_date, event_venue_times(id, start_time, end_time, access_link, access_password)')
    .eq('event_venue_id', eventVenueId)
    .order('event_date')

  return NextResponse.json({ data: dates || [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (body.action === 'add_session') {
    const access = await checkEventAccess(req, session, { eventVenueId: body.event_venue_id }, 'edit')
    if (!access.ok) return denied()
    let { data: dateRow } = await supabaseAdmin
      .from('event_venue_dates').select('id')
      .eq('event_venue_id', body.event_venue_id).eq('event_date', body.event_date).maybeSingle()

    if (!dateRow) {
      const { data: newDate, error: dateErr } = await supabaseAdmin
        .from('event_venue_dates').insert({ event_venue_id: body.event_venue_id, event_date: body.event_date }).select().single()
      if (dateErr) return NextResponse.json({ error: dateErr.message }, { status: 400 })
      dateRow = newDate
    }
    const { data, error } = await supabaseAdmin
      .from('event_venue_times')
      .insert({ event_venue_date_id: dateRow!.id, start_time: body.start_time, end_time: body.end_time || null })
      .select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    await flagPendingEditsIfActive(access.eventId!)
    return NextResponse.json({ data })
  }

  // Updates ONLY the virtual access link/password of one session (allowed even after sales).
  if (body.action === 'update_access') {
    const { id, access_link, access_password } = body
    if (!id) return NextResponse.json({ error: 'Missing session id' }, { status: 400 })
    const access = await checkEventAccess(req, session, { timeId: id }, 'edit')
    if (!access.ok) return denied()
    const { error } = await supabaseAdmin.from('event_venue_times').update({ access_link: access_link || null, access_password: access_password || null }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    await flagPendingEditsIfActive(access.eventId!)
    return NextResponse.json({ data: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const src: EventSource = type === 'date' ? { dateId: id } : { timeId: id }
  const access = await checkEventAccess(req, session, src, 'edit')
  if (!access.ok) return denied()

  if (type === 'date') {
    const { data: timeRows } = await supabaseAdmin.from('event_venue_times').select('id').eq('event_venue_date_id', id)
    const timeIds = (timeRows || []).map((t: any) => t.id)
    if (timeIds.length > 0) {
      const { data: sold } = await supabaseAdmin.from('event_ticket_assignments').select('id').in('event_venue_time_id', timeIds).gt('sold_count', 0).limit(1)
      if (sold && sold.length > 0) return NextResponse.json({ error: 'Cannot remove this date — it has ticket sales' }, { status: 400 })
    }
    await supabaseAdmin.from('event_venue_times').delete().eq('event_venue_date_id', id)
    await supabaseAdmin.from('event_venue_dates').delete().eq('id', id)
  } else {
    const { data: sold } = await supabaseAdmin.from('event_ticket_assignments').select('id').eq('event_venue_time_id', id).gt('sold_count', 0).limit(1)
    if (sold && sold.length > 0) return NextResponse.json({ error: 'Cannot remove this time slot — it has ticket sales' }, { status: 400 })
    await supabaseAdmin.from('event_venue_times').delete().eq('id', id)
  }

  await flagPendingEditsIfActive(access.eventId!)
  return NextResponse.json({ success: true })
}
