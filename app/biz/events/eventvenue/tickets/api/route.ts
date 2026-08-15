// THIS FILE GOES IN: app/biz/events/eventvenue/tickets/api/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  const { data: tickets } = await supabaseAdmin.from('event_ticket_types').select('*').eq('event_id', eventId).order('display_order')
  const ticketIds = (tickets || []).map(t => t.id)

  let assignments: any[] = []
  if (ticketIds.length > 0) {
    const { data } = await supabaseAdmin.from('event_ticket_assignments').select('ticket_type_id, event_venue_time_id').in('ticket_type_id', ticketIds)
    assignments = data || []
  }

  const { data: venues } = await supabaseAdmin
    .from('event_venues')
    .select('id, venues(external_name), event_venue_dates(id, event_date, event_venue_times(id, start_time))')
    .eq('event_id', eventId)

  return NextResponse.json({ tickets: tickets || [], assignments, venues: venues || [] })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { event_id, id, fields, assignedTimeIds } = body
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  const clean = { ...fields, sale_start: fields.sale_start || null, sale_end: fields.sale_end || null }

  let ticketId = id
  if (id) {
    const { data: existing } = await supabaseAdmin.from('event_ticket_types').select('sold_count').eq('id', id).maybeSingle()
    if (existing && clean.quantity < existing.sold_count) {
      return NextResponse.json({ error: `Quantity can't be less than ${existing.sold_count} already sold` }, { status: 400 })
    }
    const { error } = await supabaseAdmin.from('event_ticket_types').update({ ...clean, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  } else {
    const { data: maxRow } = await supabaseAdmin.from('event_ticket_types').select('display_order').eq('event_id', event_id).order('display_order', { ascending: false }).limit(1).maybeSingle()
    const nextOrder = (maxRow?.display_order ?? -1) + 1
    const { data: inserted, error } = await supabaseAdmin.from('event_ticket_types').insert({ event_id, ...clean, display_order: nextOrder }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    ticketId = inserted.id
  }

  await supabaseAdmin.from('event_ticket_assignments').delete().eq('ticket_type_id', ticketId)
  if (assignedTimeIds?.length > 0) {
    await supabaseAdmin.from('event_ticket_assignments').insert(assignedTimeIds.map((event_venue_time_id: string) => ({ ticket_type_id: ticketId, event_venue_time_id })))
  }
  return NextResponse.json({ data: { id: ticketId } })
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data: ticket } = await supabaseAdmin.from('event_ticket_types').select('sold_count').eq('id', id).maybeSingle()
  if (ticket && ticket.sold_count > 0) return NextResponse.json({ error: 'Cannot delete a ticket that has sales' }, { status: 400 })
  const { error } = await supabaseAdmin.from('event_ticket_types').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: true })
}

export async function PATCH(req: NextRequest) {
  const { order } = await req.json()
  for (const item of order || []) {
    await supabaseAdmin.from('event_ticket_types').update({ display_order: item.display_order }).eq('id', item.id)
  }
  return NextResponse.json({ data: true })
}
