import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getScopedCompanyIds } from '@/lib/companyScope'

const MASTER_COMPANY_ID = '11111111-1111-1111-1111-111111111111'

function isSuperAdmin(session: any) {
  return !!session.is_super_admin
}

async function scopedIdsFor(session: any) {
  if (isSuperAdmin(session)) return null
  return await getScopedCompanyIds(session, { module: 'company_auth' })
}

async function staffDetails(staff_id: string) {
  const { data: staff } = await supabaseAdmin.from('admin_staff').select('user_id, name, email, mobile, staff_enrollment_number').eq('id', staff_id).maybeSingle()
  if (!staff) return { name: '—', email: '', mobile: '', enrollment: '', org_id: '' }
  let orgId = ''
  if (staff.user_id) {
    const { data: u } = await supabaseAdmin.from('users').select('zy_id').eq('id', staff.user_id).maybeSingle()
    orgId = u?.zy_id || ''
    const { data: p } = await supabaseAdmin.from('profiles').select('full_name, email, mobile').eq('user_id', staff.user_id).ilike('relationship', 'self').maybeSingle()
    if (p?.full_name) return { name: p.full_name, email: p.email || staff.email || '', mobile: p.mobile || staff.mobile || '', enrollment: staff.staff_enrollment_number || '', org_id: orgId }
  }
  return { name: staff.name || staff.email || 'Unlinked staff', email: staff.email || '', mobile: staff.mobile || '', enrollment: staff.staff_enrollment_number || '', org_id: orgId }
}

async function findStaffIdsByTerm(term: string) {
  const { data: direct } = await supabaseAdmin
    .from('admin_staff').select('id')
    .or(`name.ilike.%${term}%,email.ilike.%${term}%,mobile.ilike.%${term}%,staff_enrollment_number.ilike.%${term}%`)
  const { data: viaProfile } = await supabaseAdmin.from('profiles').select('user_id').ilike('full_name', `%${term}%`)
  const profileUserIds = (viaProfile || []).map((p: any) => p.user_id).filter(Boolean)
  const { data: viaProfileStaff } = profileUserIds.length
    ? await supabaseAdmin.from('admin_staff').select('id').in('user_id', profileUserIds)
    : { data: [] }
  return [...new Set([...(direct || []).map((d: any) => d.id), ...(viaProfileStaff || []).map((s: any) => s.id)])]
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const scopedIds = await scopedIdsFor(session)

  if (searchParams.get('type') === 'company_options') {
    let q = supabaseAdmin.from('companies').select('id, display_name').eq('company_status', 'active').neq('id', MASTER_COMPANY_ID).order('display_name')
    if (scopedIds) q = q.in('id', scopedIds)
    const { data, error } = await q
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  if (searchParams.get('type') === 'module_options') {
    const { data, error } = await supabaseAdmin
      .from('modules').select('code, display_name').eq('category', 'assignable').eq('status', 'active').order('display_name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  if (searchParams.get('type') === 'staff_search') {
    const term = (searchParams.get('term') || '').trim()
    if (!term) return NextResponse.json({ data: [] })
    const { data: byUser } = await supabaseAdmin.from('users').select('id').or(`email.ilike.${term},phone.ilike.${term},zy_id.ilike.${term}`)
    const { data: byProfile } = await supabaseAdmin.from('profiles').select('user_id').or(`email.ilike.${term},mobile.ilike.${term}`)
    const userIds = [...new Set([...(byUser || []).map((u: any) => u.id), ...(byProfile || []).map((p: any) => p.user_id)])]
    const { data: viaUser } = userIds.length
      ? await supabaseAdmin.from('admin_staff').select('id, user_id').in('user_id', userIds).eq('status', 'active')
      : { data: [] }
    const { data: viaDirect } = await supabaseAdmin
      .from('admin_staff').select('id, user_id')
      .or(`email.ilike.${term},mobile.ilike.${term},staff_enrollment_number.ilike.${term}`).eq('status', 'active')
    const staffRows = [...(viaUser || []), ...(viaDirect || [])]
    const uniqueIds = [...new Set(staffRows.map((s: any) => s.id))]
    if (!uniqueIds.length) return NextResponse.json({ data: [] })
    const data = await Promise.all(uniqueIds.map(async (id: string) => {
      const row = staffRows.find((s: any) => s.id === id)
      const d = await staffDetails(id)
      return { staff_id: id, ...d, unlinked: !row?.user_id }
    }))
    return NextResponse.json({ data })
  }

  if (searchParams.get('type') === 'history') {
    const company_id = searchParams.get('company_id') || ''
    const module_code = searchParams.get('module_code') || ''
    if (!company_id || !module_code) return NextResponse.json({ error: 'company_id and module_code required' }, { status: 400 })
    const { data: rows, error } = await supabaseAdmin
      .from('region_module_auth').select('id, staff_id, status, created_at, end_date, changed_by')
      .eq('company_id', company_id).eq('module_code', module_code).order('created_at', { ascending: false })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const data = await Promise.all((rows || []).map(async (r: any) => ({ ...r, staff: await staffDetails(r.staff_id) })))
    return NextResponse.json({ data })
  }

  // Default: list active assignments - only runs when explicit filters/search are passed
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  const companyFilter = searchParams.get('company_id') || ''
  const moduleFilter = searchParams.get('module_code') || ''
  const searchTerm = (searchParams.get('search') || '').trim()

  let query = supabaseAdmin.from('region_module_auth').select('id, company_id, module_code, staff_id, created_at', { count: 'exact' }).eq('status', 'active')
  if (scopedIds) query = query.in('company_id', scopedIds)
  if (companyFilter) query = query.eq('company_id', companyFilter)
  if (moduleFilter) query = query.eq('module_code', moduleFilter)
  if (searchTerm) {
    const staffIds = await findStaffIdsByTerm(searchTerm)
    if (!staffIds.length) return NextResponse.json({ data: [], total: 0 })
    query = query.in('staff_id', staffIds)
  }

  const { data: rows, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json({ data: [], total: 0 })

  const companyIds = [...new Set(rows.map((r: any) => r.company_id))]
  const moduleCodes = [...new Set(rows.map((r: any) => r.module_code))]
  const [{ data: companies }, { data: mods }] = await Promise.all([
    supabaseAdmin.from('companies').select('id, display_name').in('id', companyIds),
    supabaseAdmin.from('modules').select('code, display_name').in('code', moduleCodes)
  ])
  const companyMap = Object.fromEntries((companies || []).map((c: any) => [c.id, c.display_name]))
  const moduleMap = Object.fromEntries((mods || []).map((m: any) => [m.code, m.display_name]))

const data = await Promise.all(rows.map(async (r: any) => {
    const staff = await staffDetails(r.staff_id)
    const canEdit = scopedIds === null || scopedIds.includes(r.company_id)
    return { ...r, company_name: companyMap[r.company_id] || '—', module_name: moduleMap[r.module_code] || r.module_code, staff_name: staff.name, staff_email: staff.email, staff_mobile: staff.mobile, can_edit: canEdit }
  }))
  return NextResponse.json({ data, total: count })
}

async function canManage(session: any, company_id: string) {
  if (isSuperAdmin(session)) return true
  const scopedIds = await getScopedCompanyIds(session, { module: 'company_auth' })
  return scopedIds ? scopedIds.includes(company_id) : false
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { company_id, module_codes, staff_id } = body
  if (!(await canManage(session, company_id))) return NextResponse.json({ error: 'No permission for this company' }, { status: 403 })

  const codes: string[] = module_codes || []
  const results: any[] = []
  const failed: string[] = []
  for (const code of codes) {
    const { data, error } = await supabaseAdmin.from('region_module_auth').insert({
      company_id, module_code: code, staff_id, status: 'active', changed_by: session.user_id
    }).select().single()
    if (error) failed.push(code); else results.push(data)
  }
  if (failed.length) return NextResponse.json({ error: `Already has an active person for: ${failed.join(', ')}`, data: results }, { status: 209 })
  return NextResponse.json({ data: results })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { id, company_id, module_code, staff_id } = body
  if (!(await canManage(session, company_id))) return NextResponse.json({ error: 'No permission for this company' }, { status: 403 })

  const { error: closeErr } = await supabaseAdmin.from('region_module_auth')
    .update({ status: 'inactive', end_date: new Date().toISOString(), changed_by: session.user_id }).eq('id', id)
  if (closeErr) return NextResponse.json({ error: closeErr.message }, { status: 500 })

  const { data, error } = await supabaseAdmin.from('region_module_auth').insert({
    company_id, module_code, staff_id, status: 'active', changed_by: session.user_id
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { id, company_id } = body
  if (!(await canManage(session, company_id))) return NextResponse.json({ error: 'No permission for this company' }, { status: 403 })

  const { error } = await supabaseAdmin.from('region_module_auth')
    .update({ status: 'inactive', end_date: new Date().toISOString(), changed_by: session.user_id }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}