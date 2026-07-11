import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const countryId = searchParams.get('country') || ''
  const companyType = searchParams.get('company_type') || ''
  const branchType = searchParams.get('branch_type') || ''
  const type = searchParams.get('type') || ''

  // All countries from country_master — for filter dropdown
  if (type === 'all_countries') {
    const { data, error } = await supabaseAdmin.from('country_master').select('id, name').eq('is_active', true).order('name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  // Active companies for parent/reporting dropdowns in wizard
  if (type === 'active_companies') {
    const { data, error } = await supabaseAdmin.from('companies').select('id, display_name').eq('company_status', 'active').order('display_name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  // Main companies list
  let query = supabaseAdmin.from('companies').select(
    'id, legal_name, display_name, slug, company_type, branch_type, company_status, created_at, parent_company_id',
    { count: 'exact' }
  ).neq('company_status', 'draft')

  if (search) query = query.or(`legal_name.ilike.%${search}%,display_name.ilike.%${search}%,slug.ilike.%${search}%`)
  if (status) query = query.eq('company_status', status)
  if (companyType) query = query.eq('company_type', companyType)
  if (branchType) query = query.eq('branch_type', branchType)

  const { data: rows, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json({ data: [], total: 0 })

  const companyIds = rows.map((r: any) => r.id)
  const parentIds = [...new Set(rows.map((r: any) => r.parent_company_id).filter(Boolean))]

  // Get registered addresses for country
  const { data: addresses } = await supabaseAdmin.from('company_addresses')
    .select('company_id, country_id').eq('address_type', 'registered').in('company_id', companyIds)

  // Filter by country if selected
  if (countryId) {
    const matched = (addresses || []).filter((a: any) => a.country_id === countryId).map((a: any) => a.company_id)
    const filtered = rows.filter((r: any) => matched.includes(r.id))
    if (!filtered.length) return NextResponse.json({ data: [], total: 0 })
  }

  const addrMap = Object.fromEntries((addresses || []).map((a: any) => [a.company_id, a.country_id]))
  const countryIds = [...new Set(Object.values(addrMap).filter(Boolean))] as string[]
  const { data: countryData } = countryIds.length
    ? await supabaseAdmin.from('country_master').select('id, name').in('id', countryIds)
    : { data: [] }
  const countryMap = Object.fromEntries((countryData || []).map((c: any) => [c.id, c.name]))

  const { data: parents } = parentIds.length
    ? await supabaseAdmin.from('companies').select('id, display_name').in('id', parentIds)
    : { data: [] }
  const parentMap = Object.fromEntries((parents || []).map((p: any) => [p.id, p.display_name]))

  const data = rows
    .filter((r: any) => !countryId || (addrMap[r.id] === countryId))
    .map((r: any) => ({
      ...r,
      country: countryMap[addrMap[r.id]] || '',
      parent: r.parent_company_id ? { display_name: parentMap[r.parent_company_id] || '' } : null
    }))

  return NextResponse.json({ data, total: count })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { id, ...fields } = body
  fields.updated_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin.from('companies').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (fields.company_status === 'active') {
    // TODO: fetch SPOC from user_roles, call sendEmail()
  }
  return NextResponse.json({ data })
}
