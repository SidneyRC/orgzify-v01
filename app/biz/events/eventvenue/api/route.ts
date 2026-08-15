// THIS FILE GOES IN: app/biz/events/eventvenue/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { VIRTUAL_VENUE_ID } from '@/lib/constants'

async function resolveNames(rows: any[]) {
  const valid = rows.filter(Boolean)
  const cityIds = [...new Set(valid.map(r => r.city_id).filter(Boolean))]
  const stateIds = [...new Set(valid.map(r => r.state_id).filter(Boolean))]
  const countryIds = [...new Set(valid.map(r => r.country_id).filter(Boolean))]
  const locIds = [...new Set([...cityIds, ...stateIds])]
  const { data: locs } = locIds.length ? await supabaseAdmin.from('locations').select('id, name').in('id', locIds) : { data: [] }
  const { data: countries } = countryIds.length ? await supabaseAdmin.from('country_master').select('id, name').in('id', countryIds) : { data: [] }
  const locMap = Object.fromEntries((locs || []).map((l: any) => [l.id, l.name]))
  const countryMap = Object.fromEntries((countries || []).map((c: any) => [c.id, c.name]))
  return rows.map(r => r ? { ...r, city_name: locMap[r.city_id] || '', state_name: locMap[r.state_id] || '', country_name: countryMap[r.country_id] || '' } : null)
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type')
  const cols = 'id, external_name, line1, area, pincode, city_id, state_id, country_id'

  if (type === 'search_venues') {
    const q = req.nextUrl.searchParams.get('q') || ''
    const entityId = req.nextUrl.searchParams.get('entity_id')
    let query = supabaseAdmin.from('venues').select(cols).eq('status', 'active').neq('visibility', 'virtual').ilike('external_name', `%${q}%`).limit(10)
    if (entityId) query = query.or(`visibility.eq.all,exclusive_entity_ids.cs.{${entityId}}`)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data: await resolveNames(data || []) })
  }

  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })

  const { data: rows } = await supabaseAdmin.from('event_venues').select(`id, venue_id, venues(${cols})`).eq('event_id', eventId)
  // Keep venueList index-aligned with rows (no filtering here) so resolveNames output maps back correctly.
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
  if (body.action === 'add_venue') {
    const { data, error } = await supabaseAdmin.from('event_venues').insert({ event_id: body.event_id, venue_id: body.venue_id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  }

  if (body.action === 'ensure_virtual') {
    const { data: existing } = await supabaseAdmin.from('event_venues').select('id').eq('event_id', body.event_id).eq('venue_id', VIRTUAL_VENUE_ID).maybeSingle()
    if (existing) return NextResponse.json({ data: existing })
    const { data, error } = await supabaseAdmin.from('event_venues').insert({ event_id: body.event_id, venue_id: VIRTUAL_VENUE_ID }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { id } = await req.json()
  const { data: dates } = await supabaseAdmin.from('event_venue_dates').select('id').eq('event_venue_id', id)
  const dateIds = (dates || []).map((d: any) => d.id)
  if (dateIds.length > 0) {
    await supabaseAdmin.from('event_venue_times').delete().in('event_venue_date_id', dateIds)
    await supabaseAdmin.from('event_venue_dates').delete().eq('event_venue_id', id)
  }
  const { error } = await supabaseAdmin.from('event_venues').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}