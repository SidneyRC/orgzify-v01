import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { action } = body

  if (action === 'get_countries') {
    const { data } = await supabaseAdmin.from('country_master').select('id, name').eq('is_active', true).order('name')
    return NextResponse.json({ data: data || [] })
  }

  if (action === 'search_pincodes') {
    const { query: q } = body
    if (!q || q.length < 2) return NextResponse.json({ data: [] })
    const { data } = await supabaseAdmin.from('pincodes')
      .select('id, pincode, area, city_id, district_id, state_id, country_id')
      .ilike('pincode', `${q}%`).eq('is_active', true).limit(10)
    return NextResponse.json({ data: data || [] })
  }

  if (action === 'add_pincode') {
    const { pincode, area, city_id, district_id, state_id, country_id } = body
    if (!pincode || !area) return NextResponse.json({ error: 'pincode and area required' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('pincodes').insert({
      pincode, area, city_id: city_id || null, district_id: district_id || null,
      state_id: state_id || null, country_id: country_id || null,
      source: 'user', is_verified: false, is_active: true, created_by: session.user_id
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (action === 'update_pincode') {
    const { id, city_id, district_id, state_id, country_id } = body
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('pincodes').update({
      city_id: city_id || null, district_id: district_id || null,
      state_id: state_id || null, country_id: country_id || null
    }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (action === 'search_locations') {
    const { query: q, level, parent_id } = body
    if (!q || q.length < 1) return NextResponse.json({ data: [] })
    let qb = supabaseAdmin.from('locations').select('id, name, level, parent_id').eq('level', level).eq('is_active', true).ilike('name', `%${q}%`).limit(10)
    if (parent_id) qb = qb.eq('parent_id', parent_id)
    const { data } = await qb
    return NextResponse.json({ data: data || [] })
  }

  if (action === 'add_location') {
    const { name, level, parent_id, country_id } = body
    if (!name || !level) return NextResponse.json({ error: 'name and level required' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('locations').insert({
      name, level, parent_id: parent_id || null, country_id: country_id || null,
      is_active: true, created_by: session.user_id
    }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  // Single ID lookup — kept for backward compatibility
  if (action === 'get_location_by_id') {
    const { id } = body
    if (!id) return NextResponse.json({ data: null })
    const { data } = await supabaseAdmin.from('locations').select('id, name, level').eq('id', id).single()
    return NextResponse.json({ data: data || null })
  }
  // Given a City or District ID, walks up the parent chain and returns
  // District, State, and Country — used to auto-fill when City is picked directly.
  if (action === 'get_location_chain') {
    const { id } = body
    if (!id) return NextResponse.json({ data: null })
    const { data: start } = await supabaseAdmin.from('locations').select('id, name, level, parent_id, country_id').eq('id', id).maybeSingle()
    if (!start) return NextResponse.json({ data: null })
    const chain: any = { country_id: start.country_id || null }
    let node: any = start
    while (node?.parent_id) {
      const { data: parent } = await supabaseAdmin.from('locations').select('id, name, level, parent_id, country_id').eq('id', node.parent_id).maybeSingle()
      if (!parent) break
      chain[parent.level] = { id: parent.id, name: parent.name }
      node = parent
    }
    return NextResponse.json({ data: chain })
  }


  // Batch ID lookup — used to fill City/District/State names when reopening a saved address
  if (action === 'get_location_names') {
    const { ids } = body
    const clean = (ids || []).filter((x: string) => !!x)
    if (clean.length === 0) return NextResponse.json({ data: {} })
    const { data } = await supabaseAdmin.from('locations').select('id, name').in('id', clean)
    const map: Record<string, string> = {}
    ;(data || []).forEach((r: any) => { map[r.id] = r.name })
    return NextResponse.json({ data: map })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}