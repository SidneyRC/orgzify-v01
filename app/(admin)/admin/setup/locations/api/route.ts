import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session || !session.user_id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
    
// Return distinct countries in locations table
if (searchParams.get('distinct_countries') === 'true') {
  const { data, error } = await supabaseAdmin
    .from('locations')
    .select('country:country_id(id, name)')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const unique = Object.values(
    Object.fromEntries((data || []).map((r: any) => [r.country?.id, r.country]))
  ).filter(Boolean)
  return NextResponse.json({ data: unique })
}

  const country_id = searchParams.get('country_id')
  const level = searchParams.get('level')
  const search = searchParams.get('search')
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const sort_by = searchParams.get('sort_by') || 'name'
  const sort_dir = searchParams.get('sort_dir') === 'desc' ? false : true
  const offset = (page - 1) * limit

  let query = supabaseAdmin
    .from('locations')
    .select(`id, name, level, code, timezone, is_active, created_at,
      parent:parent_id(id, name),
      country:country_id(id, name)`, { count: 'exact' })
    .order(sort_by, { ascending: sort_dir })
    .range(offset, offset + limit - 1)

  if (country_id) query = query.eq('country_id', country_id)
  if (level) query = query.eq('level', level)
  if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)

  const { data, error, count } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session || !session.user_id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { name, level, code, timezone, parent_id, country_id, is_active } = body

  if (!name || !level || !country_id) {
    return NextResponse.json({ error: 'Name, level and country are required' }, { status: 400 })
  }

  const { data, error } = await supabaseAdmin
    .from('locations')
    .insert({ name, level, code, timezone, parent_id: parent_id || null, country_id, is_active: is_active ?? true, created_by: session.user_id })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session || !session.user_id) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { id, ...fields } = body

  if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 })

  const { data, error } = await supabaseAdmin
    .from('locations')
    .update({ ...fields })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}