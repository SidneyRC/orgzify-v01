import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getScopedCompanyIds } from '@/lib/companyScope'

const SUPER_ADMIN_ROLE_ID = 'd48c4a41-701b-4f70-bcbe-d92020808c00'

async function isSuperAdmin(user_id: string) {
  const { data } = await supabaseAdmin
    .from('user_roles').select('id').eq('user_id', user_id).eq('role_id', SUPER_ADMIN_ROLE_ID).eq('is_active', true).maybeSingle()
  return !!data
}

async function scopedIdsFor(session: any) {
  const superAdmin = await isSuperAdmin(session.user_id)
  if (superAdmin) return null // null = no restriction
  return await getScopedCompanyIds(session, { module: 'region_module_auth' })
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const scopedIds = await scopedIdsFor(session)

  if (searchParams.get('type') === 'company_options') {
    let q = supabaseAdmin.from('companies').select('id, display_name').eq('company_status', 'active').order('display_name')
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

  if (searchParams.get('type') === 'staff_options') {
    let rq = supabaseAdmin.from('user_roles').select('user_id').eq('is_active', true)
    if (scopedIds) rq = rq.in('company_id', scopedIds)
    const { data: roleRows, error: roleErr } = await rq
    if (roleErr) return NextResponse.json({ error: roleErr.message }, { status: 500 })
    const userIds = [...new Set((roleRows || []).map((r: any) => r.user_id))]
    if (!userIds.length) return NextResponse.json({ data: [] })
    const { data: users, error: userErr } = await supabaseAdmin
      .from('users').select('id, email').in('id', userIds).eq('account_status', 'active')
    if (userErr) return NextResponse.json({ error: userErr.message }, { status: 500 })
    const { data: profiles } = await supabaseAdmin.from('profiles').select('user_id, full_name').in('user_id', userIds).ilike('relationship', 'self')
    const nameMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.full_name]))
    const data = (users || []).map((u: any) => ({ id: u.id, name: nameMap[u.id] || u.email }))
    return NextResponse.json({ data })
  }

  // Default: list assignments
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  const companyFilter = searchParams.get('company_id') || ''
  const moduleFilter = searchParams.get('module_code') || ''

  let query = supabaseAdmin.from('region_module_auth').select('id, company_id, module_code, user_id, created_at', { count: 'exact' })
  if (scopedIds) query = query.in('company_id', scopedIds)
  if (companyFilter) query = query.eq('company_id', companyFilter)
  if (moduleFilter) query = query.eq('module_code', moduleFilter)

  const { data: rows, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json({ data: [], total: 0 })

  const companyIds = [...new Set(rows.map((r: any) => r.company_id))]
  const moduleCodes = [...new Set(rows.map((r: any) => r.module_code))]
  const userIds = [...new Set(rows.map((r: any) => r.user_id))]

  const [{ data: companies }, { data: mods }, { data: users }, { data: profiles }] = await Promise.all([
    supabaseAdmin.from('companies').select('id, display_name').in('id', companyIds),
    supabaseAdmin.from('modules').select('code, display_name').in('code', moduleCodes),
    supabaseAdmin.from('users').select('id, email').in('id', userIds),
    supabaseAdmin.from('profiles').select('user_id, full_name').in('user_id', userIds).ilike('relationship', 'self')
  ])
  const companyMap = Object.fromEntries((companies || []).map((c: any) => [c.id, c.display_name]))
  const moduleMap = Object.fromEntries((mods || []).map((m: any) => [m.code, m.display_name]))
  const emailMap = Object.fromEntries((users || []).map((u: any) => [u.id, u.email]))
  const nameMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.full_name]))

  const data = rows.map((r: any) => ({
    ...r,
    company_name: companyMap[r.company_id] || '—',
    module_name: moduleMap[r.module_code] || r.module_code,
    staff_name: nameMap[r.user_id] || emailMap[r.user_id] || '—'
  }))

  return NextResponse.json({ data, total: count })
}

async function canManage(session: any, company_id: string) {
  const superAdmin = await isSuperAdmin(session.user_id)
  if (superAdmin) return true
  const scopedIds = await getScopedCompanyIds(session, { module: 'region_module_auth' })
  return scopedIds ? scopedIds.includes(company_id) : false
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  if (!(await canManage(session, body.company_id))) return NextResponse.json({ error: 'No permission for this company' }, { status: 403 })

  const { data, error } = await supabaseAdmin.from('region_module_auth').insert({
    company_id: body.company_id, module_code: body.module_code, user_id: body.user_id
  }).select().single()

  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'This company already has a person assigned for this module. Edit the existing entry instead.' }, { status: 409 })
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { id, company_id, user_id } = body
  if (!(await canManage(session, company_id))) return NextResponse.json({ error: 'No permission for this company' }, { status: 403 })

  const { data, error } = await supabaseAdmin.from('region_module_auth').update({ user_id }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { id, company_id } = body
  if (!(await canManage(session, company_id))) return NextResponse.json({ error: 'No permission for this company' }, { status: 403 })

  const { error } = await supabaseAdmin.from('region_module_auth').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}