import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const country_id = searchParams.get('country_id')
  const state_id = searchParams.get('state_id')
  const district_id = searchParams.get('district_id')
  const city_id = searchParams.get('city_id')
  const search = searchParams.get('search') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit

  // All countries from country_master — for popup
  if (searchParams.get('type') === 'all_countries') {
    const { data, error } = await supabaseAdmin.from('country_master').select('id, name').eq('is_active', true).order('name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  // Distinct countries from pincodes table — for toolbar filter
  if (searchParams.get('type') === 'countries') {
    const { data: pins, error } = await supabaseAdmin.from('pincodes').select('country_id').eq('is_active', true)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const ids = [...new Set((pins || []).map((p: any) => p.country_id).filter(Boolean))]
    if (!ids.length) return NextResponse.json({ data: [] })
    const { data } = await supabaseAdmin.from('country_master').select('id, name').in('id', ids).order('name')
    return NextResponse.json({ data: data || [] })
  }

  // Locations for dropdowns — state/district/city
  if (searchParams.get('type') === 'locations') {
    const level = searchParams.get('level')
    const parent_id = searchParams.get('parent_id')
    const cid = searchParams.get('country_id')
    let query = supabaseAdmin.from('locations').select('id, name').eq('level', level!).eq('is_active', true)
    if (parent_id) query = query.eq('parent_id', parent_id)
    if (cid) query = query.eq('country_id', cid)
    const { data, error } = await query.order('name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  // Main pincodes list — only when filter/search active
  const hasFilter = country_id || state_id || district_id || city_id || search
  if (!hasFilter) return NextResponse.json({ data: [], total: 0, page, limit })

  let query = supabaseAdmin.from('pincodes').select(
    'id, pincode, area, source, is_verified, is_active, created_at, country_id, state_id, district_id, city_id',
    { count: 'exact' }
  )
  if (country_id) query = query.eq('country_id', country_id)
  if (state_id) query = query.eq('state_id', state_id)
  if (district_id) query = query.eq('district_id', district_id)
  if (city_id) query = query.eq('city_id', city_id)
  if (search) query = query.ilike('pincode', `%${search}%`)

  const { data: rows, error, count } = await query.order('pincode').range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json({ data: [], total: 0, page, limit })

  const countryIds = [...new Set(rows.map((r: any) => r.country_id).filter(Boolean))]
  const locationIds = [...new Set([...rows.map((r: any) => r.state_id), ...rows.map((r: any) => r.district_id), ...rows.map((r: any) => r.city_id)].filter(Boolean))]

  const [{ data: countries }, { data: locations }] = await Promise.all([
    supabaseAdmin.from('country_master').select('id, name').in('id', countryIds.length ? countryIds : ['none']),
    supabaseAdmin.from('locations').select('id, name').in('id', locationIds.length ? locationIds : ['none'])
  ])

  const countryMap = Object.fromEntries((countries || []).map((c: any) => [c.id, c.name]))
  const locationMap = Object.fromEntries((locations || []).map((l: any) => [l.id, l.name]))

  const data = rows.map((r: any) => ({
    ...r,
    country: r.country_id ? { id: r.country_id, name: countryMap[r.country_id] || '' } : null,
    state: r.state_id ? { id: r.state_id, name: locationMap[r.state_id] || '' } : null,
    district: r.district_id ? { id: r.district_id, name: locationMap[r.district_id] || '' } : null,
    city: r.city_id ? { id: r.city_id, name: locationMap[r.city_id] || '' } : null,
  }))

  return NextResponse.json({ data, total: count, page, limit })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  if (body.action === 'add_location') {
    const { name, level, parent_id, country_id } = body
    const { data, error } = await supabaseAdmin.from('locations').insert({ name, level, parent_id: parent_id || null, country_id, is_active: true, created_by: session.user_id }).select('id, name').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }
  const { pincode, area, city_id, district_id, state_id, country_id, is_verified, is_active } = body
  const { data, error } = await supabaseAdmin.from('pincodes').insert({ pincode, area, city_id, district_id, state_id, country_id, source: 'manual', is_verified: is_verified ?? false, is_active: is_active ?? true, created_by: session.user_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { id, ...fields } = body
  const { data, error } = await supabaseAdmin.from('pincodes').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
