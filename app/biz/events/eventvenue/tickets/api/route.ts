// THIS FILE GOES IN: app/biz/events/eventvenue/tickets/api/route.ts (REPLACE EXISTING)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  const { data: tickets } = await supabaseAdmin.from('event_ticket_types').select('id, name, people_per_ticket, ticket_type, display_order').eq('event_id', eventId).order('display_order')
  const ticketIds = (tickets || []).map(t => t.id)

  let assignments: any[] = []
  if (ticketIds.length > 0) {
    const { data } = await supabaseAdmin.from('event_ticket_assignments').select('id, ticket_type_id, event_venue_time_id, price, quantity, description, goodies, is_enabled, fast_selling_forced, sold_count').in('ticket_type_id', ticketIds)
    assignments = data || []
  }

  const { data: venues } = await supabaseAdmin
    .from('event_venues')
    .select('id, venues(external_name), event_venue_dates(id, event_date, event_venue_times(id, start_time))')
    .eq('event_id', eventId)

  return NextResponse.json({ tickets: tickets || [], assignments, venues: venues || [] })
}

// Create: makes the shared ticket identity (name/people_per_ticket/type) then one
// assignment row per selected slot, seeded with the starting price/quantity/description/goodies.
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { event_id, fields, assignedTimeIds } = body
  if (!event_id) return NextResponse.json({ error: 'event_id required' }, { status: 400 })

  const identity = { name: fields.name, people_per_ticket: Number(fields.people_per_ticket) || 1, ticket_type: fields.ticket_type }
  const { data: maxRow } = await supabaseAdmin.from('event_ticket_types').select('display_order').eq('event_id', event_id).order('display_order', { ascending: false }).limit(1).maybeSingle()
  const nextOrder = (maxRow?.display_order ?? -1) + 1
  const { data: inserted, error } = await supabaseAdmin.from('event_ticket_types').insert({ event_id, ...identity, display_order: nextOrder }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const startPrice = fields.ticket_type === 'free' ? 0 : Math.max(1, Number(fields.price) || 1)
  const startQty = Math.max(0, Number(fields.quantity) || 0)
  if (assignedTimeIds?.length > 0) {
    const { error: assignError } = await supabaseAdmin.from('event_ticket_assignments').insert(assignedTimeIds.map((event_venue_time_id: string) => ({ ticket_type_id: inserted.id, event_venue_time_id, price: startPrice, quantity: startQty, description: fields.description || null, goodies: fields.goodies || [] })))
    if (assignError) return NextResponse.json({ error: assignError.message }, { status: 500 })
  }
  return NextResponse.json({ data: { id: inserted.id } })
}

// PATCH handles two things:
// 1) display-order reordering (order[] payload) — unchanged.
// 2) bulkSave — the new full-edit-screen save. Updates identity (name/people_per_ticket)
//    then applies price/quantity/description/goodies to every CHECKED slot in one batch:
//    existing rows get one bulk UPDATE, missing rows get one bulk INSERT. Sold slots are
//    always skipped server-side even if the client somehow included them.
export async function PATCH(req: NextRequest) {
  const body = await req.json()

  if (body.order) {
    for (const item of body.order) await supabaseAdmin.from('event_ticket_types').update({ display_order: item.display_order }).eq('id', item.id)
    return NextResponse.json({ data: true })
  }

  if (body.bulkSave) {
    const { ticket_id, identity, slot, checkedTimeIds } = body.bulkSave
    if (!ticket_id) return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })

    const identityUpdate = { name: identity.name, people_per_ticket: Number(identity.people_per_ticket) || 1, updated_at: new Date().toISOString() }
    const slotValues = { price: identity.ticket_type === 'free' ? 0 : Math.max(1, Number(slot.price) || 1), quantity: Math.max(0, Number(slot.quantity) || 0), description: slot.description || null, goodies: slot.goodies || [] }

    const { data: existing } = await supabaseAdmin.from('event_ticket_assignments').select('id, event_venue_time_id, sold_count').eq('ticket_type_id', ticket_id)
    const existingMap = new Map((existing || []).map((a: any) => [a.event_venue_time_id, a]))

    const updateIds: string[] = []
    const insertRows: any[] = []
    for (const timeId of (checkedTimeIds || [])) {
      const match: any = existingMap.get(timeId)
      if (match) { if ((match.sold_count || 0) === 0) updateIds.push(match.id) }
      else insertRows.push({ ticket_type_id: ticket_id, event_venue_time_id: timeId, ...slotValues })
    }

        const tasks: any[] = [supabaseAdmin.from('event_ticket_types').update(identityUpdate).eq('id', ticket_id)]
    if (updateIds.length > 0) tasks.push(supabaseAdmin.from('event_ticket_assignments').update(slotValues).in('id', updateIds))
    if (insertRows.length > 0) tasks.push(supabaseAdmin.from('event_ticket_assignments').insert(insertRows))
    const results = await Promise.all(tasks)
    const failed = results.find(r => r.error)
    if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 })

    return NextResponse.json({ data: true })
  }

  return NextResponse.json({ error: 'Unrecognized request' }, { status: 400 })
}

// Slot-level quick toggle: is_enabled / fast_selling_forced for ONE assignment row.
export async function PUT(req: NextRequest) {
  const { assignment_id, is_enabled, fast_selling_forced } = await req.json()
  if (!assignment_id) return NextResponse.json({ error: 'assignment_id required' }, { status: 400 })
  const update: any = {}
  if (is_enabled !== undefined) update.is_enabled = is_enabled
  if (fast_selling_forced !== undefined) update.fast_selling_forced = fast_selling_forced
  const { error } = await supabaseAdmin.from('event_ticket_assignments').update(update).eq('id', assignment_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: true })
}

// Delete one slot only, blocked if that slot has sales. Ticket identity is NEVER
// auto-deleted, even if this was its last slot — stays available for reuse.
export async function DELETE(req: NextRequest) {
  const assignmentId = req.nextUrl.searchParams.get('assignment_id')
  if (!assignmentId) return NextResponse.json({ error: 'assignment_id required' }, { status: 400 })

  const { data: assignment } = await supabaseAdmin.from('event_ticket_assignments').select('sold_count').eq('id', assignmentId).maybeSingle()
  if (!assignment) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  if (assignment.sold_count > 0) return NextResponse.json({ error: 'Cannot delete — this ticket has sales' }, { status: 400 })

  const { error } = await supabaseAdmin.from('event_ticket_assignments').delete().eq('id', assignmentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: true })
}
