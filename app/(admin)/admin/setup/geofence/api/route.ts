// OREV1-048-API — Geofence Companies List API
// THIS FILE GOES IN: app/(admin)/admin/setup/geofence/api/route.ts
// GET: companies list with all filters + assigned status + live counts + download
// Scoped to self + downline using the same cookie pattern as Companies API

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getScopedCompanyIds } from '@/lib/companyScope'

const SUPER_ADMIN_ID = '11111111-1111-1111-1111-111111111111'

function getScope(req: NextRequest) {
  const rawContext = decodeURIComponent(req.cookies.get('orgzify_context')?.value || '')
  const [ctxType, ctxId] = rawContext.split(':')
  const processId = ctxType === 'company' ? ctxId : undefined
  return { processId, module: 'geofence' }
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const type = searchParams.get('type')
  const scope = getScope(req)
  const scopedIds = await getScopedCompanyIds(session, scope)
  // scopedIds === null means Super Admin (no filter). [] means no access at all.
  if (scopedIds && scopedIds.length === 0) {
    if (type === 'counts') return NextResponse.json({ companies: 0, countries: 0, states: 0 })
    if (type === 'active_companies' || type === 'all_countries') return NextResponse.json({ data: [] })
    if (type === 'download') return NextResponse.json({ error: 'No access' }, { status: 403 })
    return NextResponse.json({ data: [], total: 0 })
  }

  // Live counts for setup card
  if (type === 'counts') {
    let countQuery = supabaseAdmin.from('branch_coverage').select('company_id', { count: 'exact', head: true })
    if (scopedIds) countQuery = countQuery.in('company_id', scopedIds)
    const { count: companies } = await countQuery

    let covQuery = supabaseAdmin.from('branch_coverage').select('company_id, country_id, state_id').not('country_id', 'is', null)
    if (scopedIds) covQuery = covQuery.in('company_id', scopedIds)
    const { data: countryRows } = await covQuery
    const uniqueCountries = new Set((countryRows || []).filter((r: any) => !r.state_id).map((r: any) => r.country_id)).size
    const uniqueStates = new Set((countryRows || []).filter((r: any) => !!r.state_id).map((r: any) => r.state_id)).size
    return NextResponse.json({ companies: companies ?? 0, countries: uniqueCountries, states: uniqueStates })
  }

  // Dropdown sources — reuse same pattern as companies page
  if (type === 'active_companies') {
    let q = supabaseAdmin.from('companies').select('id, display_name').eq('company_status', 'active').neq('id', SUPER_ADMIN_ID).order('display_name')
    if (scopedIds) q = q.in('id', scopedIds)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  if (type === 'all_countries') {
    let q = supabaseAdmin.from('company_addresses').select('company_id, country_id, country_master(id, name)').not('country_id', 'is', null)
    if (scopedIds) q = q.in('company_id', scopedIds)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const seen = new Set()
    const countries = (data || []).filter((r: any) => {
      if (!r.country_master || seen.has(r.country_id)) return false
      seen.add(r.country_id); return true
    }).map((r: any) => ({ id: r.country_master.id, name: r.country_master.name }))
    return NextResponse.json({ data: countries })
  }

  // Download territory list — single CSV for one or more companies
  if (type === 'download') {
    const companyIdsParam = searchParams.get('company_ids') || searchParams.get('company_id') || ''
    let companyIds = companyIdsParam.split(',').filter(Boolean)
    if (scopedIds) companyIds = companyIds.filter(id => scopedIds.includes(id))
    if (!companyIds.length) return NextResponse.json({ error: 'No access' }, { status: 403 })

    const { data: companiesData } = await supabaseAdmin.from('companies').select('id, display_name').in('id', companyIds)
    const companyMap = Object.fromEntries((companiesData || []).map((c: any) => [c.id, c.display_name]))

    const { data: rows } = await supabaseAdmin
      .from('branch_coverage')
      .select('company_id, country_id, state_id, city_id, country_master(name)')
      .in('company_id', companyIds)

    const stateIds = (rows || []).filter((r: any) => r.state_id).map((r: any) => r.state_id)
    const cityIds = (rows || []).filter((r: any) => r.city_id).map((r: any) => r.city_id)
    const allLocIds = [...new Set([...stateIds, ...cityIds])]
    const { data: locs } = allLocIds.length ? await supabaseAdmin.from('locations').select('id, name').in('id', allLocIds) : { data: [] }
    const locMap = Object.fromEntries((locs || []).map((l: any) => [l.id, l.name]))

    const lines = ['Company Name,Country,State,District,City']
    ;(rows || []).forEach((r: any) => {
      const companyName = companyMap[r.company_id] || ''
      const countryName = r.country_master?.name || ''
      const stateName = r.state_id ? (locMap[r.state_id] || '') : ''
      const cityName = r.city_id ? (locMap[r.city_id] || '') : ''
      lines.push(`${companyName},${countryName},${stateName},,${cityName}`)
    })
    const csv = lines.join('\n')
    const filename = companyIds.length === 1 ? `${companyMap[companyIds[0]] || 'territory'}-geofence.csv` : 'geofence-territories.csv'
    return new NextResponse(csv, {
      headers: { 'Content-Type': 'text/csv', 'Content-Disposition': `attachment; filename="${filename}"` }
    })
  }

  // Companies list with filters
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || ''
  const country = searchParams.get('country') || ''
  const company_type = searchParams.get('company_type') || ''
  const branch_type = searchParams.get('branch_type') || ''
  const parent_id = searchParams.get('parent_id') || ''
  const assignedStatus = searchParams.get('assigned_status') || ''
  const companyStatus = searchParams.get('company_status') || 'active'

  let query = supabaseAdmin.from('companies')
    .select('id, legal_name, display_name, company_type, branch_type, company_status, parent_company_id, process_id, company_code', { count: 'exact' })
    .neq('id', SUPER_ADMIN_ID)

  if (companyStatus !== 'all') query = query.eq('company_status', companyStatus)

  if (scopedIds) query = query.in('id', scopedIds)
  if (search) query = query.or(`legal_name.ilike.%${search}%,display_name.ilike.%${search}%,process_id.ilike.%${search}%,company_code.ilike.%${search}%`)
  if (company_type) query = query.eq('company_type', company_type)
  if (branch_type) query = query.eq('branch_type', branch_type)
  if (parent_id) query = query.eq('parent_company_id', parent_id)

  const { data: rows, error, count } = await query.order('display_name').range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json({ data: [], total: 0 })

  const { data: covered } = await supabaseAdmin.from('branch_coverage').select('company_id')
  const assignedIds = new Set((covered || []).map((r: any) => r.company_id))

  const parentIds = [...new Set(rows.map((r: any) => r.parent_company_id).filter(Boolean))]
  const { data: parents } = parentIds.length
    ? await supabaseAdmin.from('companies').select('id, display_name').in('id', parentIds)
    : { data: [] }
  const parentMap = Object.fromEntries((parents || []).map((p: any) => [p.id, p.display_name]))

  let data = rows.map((r: any) => ({
    ...r,
    is_assigned: assignedIds.has(r.id),
    parent: r.parent_company_id ? { display_name: parentMap[r.parent_company_id] || '' } : null
  }))

  if (assignedStatus === 'yes') data = data.filter(r => r.is_assigned)
  if (assignedStatus === 'no') data = data.filter(r => !r.is_assigned)

  return NextResponse.json({ data, total: assignedStatus ? data.length : (count ?? 0) })
}
