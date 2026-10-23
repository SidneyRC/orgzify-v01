// THIS FILE GOES IN: app/biz/events/eventvenue/tickets/api/route.ts (REPLACE EXISTING)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { checkEventAccess } from '@/lib/eventAccess'

const unauth = () => NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
// A refused person is told the event "cannot be found", never "not allowed".
const noEvent = () => NextResponse.json({ error: 'Event not found' }, { status: 404 })
const mayUse = async (req: NextRequest, session: any, eventId: string | null, mode: 'view' | 'edit') =>
  !!eventId && (await checkEventAccess(req, session, { eventId }, mode)).ok

async function flagPendingEditsIfActive(eventId: string) {
  const { data: event } = await supabaseAdmin.from('events').select('status').eq('id', eventId).maybeSingle()
  if (event?.status === 'active') await supabaseAdmin.from('events').update({ has_pending_edits: true }).eq('id', eventId)
}
// The event a ticket belongs to.
async function eventOfTicket(ticketId: string): Promise<string | null> {
  const { data } = await supabaseAdmin.from('event_ticket_types').select('event_id').eq('id', ticketId).maybeSingle()
  return data?.event_id || null
}
// A ticket slot (assignment) and the event it belongs to.
async function loadAssignment(id: string) {
  const { data: a } = await supabaseAdmin.from('event_ticket_assignments').select('sold_count, ticket_type_id').eq('id', id).maybeSingle()
  return { a, eventId: a ? await eventOfTicket(a.ticket_type_id) : null }
}
// True when every session id belongs to this event (a ticket can never be attached to another event's session).
async function timesBelong(eventId: string, timeIds: string[]) {
  if (!timeIds || timeIds.length === 0) return true
  const { data } = await supabaseAdmin.from('event_venues').select('event_venue_dates(event_venue_times(id))').eq('event_id', eventId)
  const ok = new Set<string>()
  for (const v of (data || []) as any[]) for (const d of v.event_venue_dates || []) for (const t of d.event_venue_times || []) ok.add(t.id)
  return timeIds.every(id => ok.has(id))
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return unauth()
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  if (!(await mayUse(req, session, eventId, 'view'))) return noEvent()
  const { data: tickets } = await supabaseAdmin.from('event_ticket_types').select('id, name, people_per_ticket, ticket_type, display_order').eq('event_id', eventId).order('display_order')
  const ticketIds = (tickets || []).map(t => t.id)
  let assignments: any[] = []
  if (ticketIds.length > 0) {
    const { data } = await supabaseAdmin.from('event_ticket_assignments').select('id, ticket_type_id, event_venue_time_id, price, quantity, description, goodies, is_enabled, fast_selling_forced, sold_count').in('ticket_type_id', ticketIds)
    assignments = data || []
  }
  const { data: venues } = await supabaseAdmin.from('event_venues').select('id, venues(external_name), event_venue_dates(id, event_date, event_venue_times(id, start_time))').eq('event_id', eventId)
  return NextResponse.json({ tickets: tickets || [], assignments, venues: venues || [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return unauth()
  const body = await req.json()
  const { event_id, fields, assignedTimeIds } = body
  if (!event_id || !fields) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  if (!(await mayUse(req, session, event_id, 'edit'))) return noEvent()
  if (!(await timesBelong(event_id, assignedTimeIds))) return noEvent()
  const identity = { name: fields.name, people_per_ticket: Number(fields.people_per_ticket) || 1, ticket_type: fields.ticket_type }
  const { data: maxRow } = await supabaseAdmin.from('event_ticket_types').select('display_order').eq('event_id', event_id).order('display_order', { ascending: false }).limit(1).maybeSingle()
  const nextOrder = (maxRow?.display_order ?? -1) + 1
  const { data: inserted, error } = await supabaseAdmin.from('event_ticket_types').insert({ event_id, ...identity, display_order: nextOrder }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const startPrice = fields.ticket_type === 'free' ? 0 : Math.max(1, Number(fields.price) || 1); const startQty = Math.max(0, Number(fields.quantity) || 0)
  if (assignedTimeIds?.length > 0) {
    const { error: assignError } = await supabaseAdmin.from('event_ticket_assignments').insert(assignedTimeIds.map((event_venue_time_id: string) => ({ ticket_type_id: inserted.id, event_venue_time_id, price: startPrice, quantity: startQty, description: fields.description || null, goodies: fields.goodies || [] })))
    if (assignError) return NextResponse.json({ error: assignError.message }, { status: 500 })
  }
  await flagPendingEditsIfActive(event_id)
  return NextResponse.json({ data: { id: inserted.id } })
}

// PATCH: reorder, or bulkSave. Quantity-only changes never flag approval; sold tickets accept only Quantity.
export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return unauth()
  const body = await req.json()
  if (body.order) {
    const items = body.order as { id: string; display_order: number }[]
    if (!Array.isArray(items) || !items.length || !items.every(i => i && typeof i.id === 'string')) return NextResponse.json({ error: 'Missing items' }, { status: 400 })
    const ids = [...new Set(items.map(i => i.id))]
    const { data: rows } = await supabaseAdmin.from('event_ticket_types').select('id, event_id').in('id', ids)
    const owners = [...new Set((rows || []).map((r: any) => r.event_id))] as string[]
    // every ticket must exist and belong to ONE event
    if ((rows || []).length !== ids.length || owners.length !== 1 || !(await mayUse(req, session, owners[0], 'edit'))) return noEvent()
    for (const item of items) await supabaseAdmin.from('event_ticket_types').update({ display_order: item.display_order }).eq('id', item.id)
    return NextResponse.json({ data: true })
  }
  if (body.bulkSave) {
    const { ticket_id, identity, slot, checkedTimeIds } = body.bulkSave
    if (!ticket_id) return NextResponse.json({ error: 'ticket_id required' }, { status: 400 })
    const { data: old } = await supabaseAdmin.from('event_ticket_types').select('name, people_per_ticket, event_id').eq('id', ticket_id).maybeSingle()
    if (!old || !(await mayUse(req, session, old.event_id, 'edit'))) return noEvent()
    if (!(await timesBelong(old.event_id, checkedTimeIds))) return noEvent()
    const { data: existing } = await supabaseAdmin.from('event_ticket_assignments').select('id, event_venue_time_id, sold_count, price, description, goodies').eq('ticket_type_id', ticket_id)
    const existingMap = new Map((existing || []).map((a: any) => [a.event_venue_time_id, a]))
    const hasAnySale = (existing || []).some((a: any) => (a.sold_count || 0) > 0)
    const qty = Math.max(0, Number(slot.quantity) || 0)
    const price = identity.ticket_type === 'free' ? 0 : Math.max(1, Number(slot.price) || 1)
    const slotValues = { price, quantity: qty, description: slot.description || null, goodies: slot.goodies || [] }
    const people = Number(identity.people_per_ticket) || 1
    const idChanged = !hasAnySale && (old?.name !== identity.name || old?.people_per_ticket !== people)
    let needsApproval = idChanged
    const ids: string[] = []; const insertRows: any[] = []
    for (const timeId of (checkedTimeIds || [])) {
      const m: any = existingMap.get(timeId)
      if (!m) { insertRows.push({ ticket_type_id: ticket_id, event_venue_time_id: timeId, ...slotValues }); needsApproval = true; continue }
      if (qty < (m.sold_count || 0)) return NextResponse.json({ error: `Quantity cannot be below ${m.sold_count} already sold` }, { status: 400 })
      ids.push(m.id)
      const changed = Number(m.price) !== price || (m.description || '') !== (slotValues.description || '') || JSON.stringify(m.goodies || []) !== JSON.stringify(slotValues.goodies)
      if (!hasAnySale && changed) needsApproval = true
    }
    const tasks: any[] = []
    if (idChanged) tasks.push(supabaseAdmin.from('event_ticket_types').update({ name: identity.name, people_per_ticket: people, updated_at: new Date().toISOString() }).eq('id', ticket_id))
    if (ids.length > 0) tasks.push(supabaseAdmin.from('event_ticket_assignments').update(hasAnySale ? { quantity: qty } : slotValues).in('id', ids))
    if (insertRows.length > 0) tasks.push(supabaseAdmin.from('event_ticket_assignments').insert(insertRows))
    const results = await Promise.all(tasks)
    const failed = results.find(r => r.error); if (failed?.error) return NextResponse.json({ error: failed.error.message }, { status: 500 })
    if (needsApproval && old?.event_id) await flagPendingEditsIfActive(old.event_id)
    return NextResponse.json({ data: true })
  }
  return NextResponse.json({ error: 'Unrecognized request' }, { status: 400 })
}

// Quick toggles (Status / Fast selling): instant, never need approval.
export async function PUT(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return unauth()
  const { assignment_id, is_enabled, fast_selling_forced } = await req.json()
  if (!assignment_id) return NextResponse.json({ error: 'assignment_id required' }, { status: 400 })
  const { eventId } = await loadAssignment(assignment_id)
  if (!(await mayUse(req, session, eventId, 'edit'))) return noEvent()
  const update: any = {}; if (is_enabled !== undefined) update.is_enabled = is_enabled
  if (fast_selling_forced !== undefined) update.fast_selling_forced = fast_selling_forced
  const { error } = await supabaseAdmin.from('event_ticket_assignments').update(update).eq('id', assignment_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: true })
}

// Delete one slot only; blocked if it has sales.
export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return unauth()
  const assignmentId = req.nextUrl.searchParams.get('assignment_id')
  if (!assignmentId) return NextResponse.json({ error: 'assignment_id required' }, { status: 400 })
  const { a: assignment, eventId } = await loadAssignment(assignmentId)
  if (!assignment || !(await mayUse(req, session, eventId, 'edit'))) return noEvent()
  if (assignment.sold_count > 0) return NextResponse.json({ error: 'Cannot delete — this ticket has sales' }, { status: 400 })
  const { error } = await supabaseAdmin.from('event_ticket_assignments').delete().eq('id', assignmentId)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await flagPendingEditsIfActive(eventId!)
  return NextResponse.json({ data: true })
}
