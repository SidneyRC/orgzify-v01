// THIS FILE GOES IN: app/biz/events/eventvenue/api/route.ts (REPLACES EXISTING)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { VIRTUAL_VENUE_ID } from '@/lib/constants'
import { checkEventAccess } from '@/lib/eventAccess'
import { hasModuleRight } from '@/lib/adminModuleRights'
import { getActiveEntityContext } from '@/lib/activeCompanyContext'

// A refused person is told the event "cannot be found", never "not allowed".
const noEvent = () => NextResponse.json({ error: 'Event not found' }, { status: 404 })
const mayUse = async (req: NextRequest, session: any, eventId: string, mode: 'view' | 'edit') =>
  (await checkEventAccess(req, session, { eventId }, mode)).ok

async function flagPendingEditsIfActive(eventId: string) {
  const { data: event } = await supabaseAdmin.from('events').select('status').eq('id', eventId).maybeSingle()
  if (event?.status === 'active') await supabaseAdmin.from('events').update({ has_pending_edits: true }).eq('id', eventId)
}

async function resolveNames(rows: any[]) {
  const valid = rows.filter(Boolean)
  const locIds = [...new Set(valid.flatMap(r => [r.city_id, r.state_id]).filter(Boolean))]
  const countryIds = [...new Set(valid.map(r => r.country_id).filter(Boolean))]
  const { data: locs } = locIds.length ? await supabaseAdmin.from('locations').select('id, name').in('id', locIds) : { data: [] }
  const { data: countries } = countryIds.length ? await supabaseAdmin.from('country_master').select('id, name').in('id', countryIds) : { data: [] }
  const locMap = Object.fromEntries((locs || []).map((l: any) => [l.id, l.name])); const countryMap = Object.fromEntries((countries || []).map((c: any) => [c.id, c.name]))
  return rows.map(r => r ? { ...r, city_name: locMap[r.city_id] || '', state_name: locMap[r.state_id] || '', country_name: countryMap[r.country_id] || '' } : null)
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type')
  const cols = 'id, external_name, line1, area, pincode, city_id, state_id, country_id'

  if (type === 'search_venues') {
    const q = req.nextUrl.searchParams.get('q') || ''
    // The business comes from the login cookie, never from the browser (an Admin with the Events right may pass it).
    let entityId: string | null = (await getActiveEntityContext(req.cookies)).entityId
    if (!entityId && (await hasModuleRight(req, session, 'events', 'can_edit'))) entityId = req.nextUrl.searchParams.get('entity_id')
    let query: any = supabaseAdmin.from('venues').select(cols).eq('status', 'active').neq('visibility', 'virtual').ilike('external_name', `%${q}%`).limit(10)
    query = entityId && /^[0-9a-f-]{36}$/i.test(entityId) ? query.or(`visibility.eq.all,exclusive_entity_ids.cs.{${entityId}}`) : query.eq('visibility', 'all')
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data: await resolveNames(data || []) })
  }

  const eventId = req.nextUrl.searchParams.get('event_id'); if (!eventId) return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })
  if (!(await mayUse(req, session, eventId, 'view'))) return noEvent()

  const { data: rows } = await supabaseAdmin.from('event_venues').select(`id, venue_id, venues(${cols})`).eq('event_id', eventId)
  const venueList = (rows || []).map((r: any) => (Array.isArray(r.venues) ? r.venues[0] : r.venues) || null)
  const resolved = await resolveNames(venueList)
  const selected = (rows || [])
    .map((r: any, i: number) => ({ id: r.id, venue_id: r.venue_id, venue: resolved[i] }))
    .filter((s: any) => s.venue)

  return NextResponse.json({ selected })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  if (!body.event_id) return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })
  if (!(await mayUse(req, session, body.event_id, 'edit'))) return noEvent()

  if (body.action === 'add_venue') {
    const { data, error } = await supabaseAdmin.from('event_venues').insert({ event_id: body.event_id, venue_id: body.venue_id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    await flagPendingEditsIfActive(body.event_id); return NextResponse.json({ data })
  }

  // One virtual row per event, guaranteed by a DB unique constraint. If two
  // requests race (common in dev, where startup code can run twice), the
  // second insert is rejected (code 23505) — we just re-fetch the first one.
  if (body.action === 'ensure_virtual') {
    const { data: existing } = await supabaseAdmin.from('event_venues').select('id').eq('event_id', body.event_id).eq('venue_id', VIRTUAL_VENUE_ID).maybeSingle()
    if (existing) return NextResponse.json({ data: existing })
    const { data, error } = await supabaseAdmin.from('event_venues').insert({ event_id: body.event_id, venue_id: VIRTUAL_VENUE_ID }).select().single()
    if (error && (error as any).code === '23505') {
      const { data: row } = await supabaseAdmin.from('event_venues').select('id').eq('event_id', body.event_id).eq('venue_id', VIRTUAL_VENUE_ID).maybeSingle()
      if (row) return NextResponse.json({ data: row })
    }
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { data: venueRow } = await supabaseAdmin.from('event_venues').select('event_id').eq('id', id).maybeSingle()
  if (!venueRow || !(await mayUse(req, session, venueRow.event_id, 'edit'))) return noEvent()
  const { data: dates } = await supabaseAdmin.from('event_venue_dates').select('id').eq('event_venue_id', id)
  const dateIds = (dates || []).map((d: any) => d.id)

  if (dateIds.length > 0) {
    const { data: timeRows } = await supabaseAdmin.from('event_venue_times').select('id').in('event_venue_date_id', dateIds)
    const timeIds = (timeRows || []).map((t: any) => t.id)
    if (timeIds.length > 0) {
      const { data: sold } = await supabaseAdmin.from('event_ticket_assignments').select('id').in('event_venue_time_id', timeIds).gt('sold_count', 0).limit(1)
      if (sold && sold.length > 0) return NextResponse.json({ error: 'Cannot remove this venue — it has ticket sales' }, { status: 400 })
    }
    await supabaseAdmin.from('event_venue_times').delete().in('event_venue_date_id', dateIds)
    await supabaseAdmin.from('event_venue_dates').delete().eq('event_venue_id', id)
  }
  const { error } = await supabaseAdmin.from('event_venues').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  await flagPendingEditsIfActive(venueRow.event_id)
  return NextResponse.json({ success: true })
}
