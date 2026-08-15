// THIS FILE GOES IN: app/biz/events/venue/schedule/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const eventVenueId = req.nextUrl.searchParams.get('event_venue_id')
  if (!eventVenueId) return NextResponse.json({ error: 'Missing event_venue_id' }, { status: 400 })

  const { data: dates } = await supabaseAdmin
    .from('event_venue_dates')
    .select('id, event_date, event_venue_times(id, start_time, end_time)')
    .eq('event_venue_id', eventVenueId)
    .order('event_date')

  return NextResponse.json({ data: dates || [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (body.action === 'add_session') {
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
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { type, id } = await req.json()
  if (type === 'date') {
    await supabaseAdmin.from('event_venue_times').delete().eq('event_venue_date_id', id)
    await supabaseAdmin.from('event_venue_dates').delete().eq('id', id)
  } else {
    await supabaseAdmin.from('event_venue_times').delete().eq('id', id)
  }
  return NextResponse.json({ success: true })
}
