import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

const MASTER_COMPANY_ID = '11111111-1111-1111-1111-111111111111'

async function getDownlineIds(rootId: string) {
  const ids = [rootId]; let frontier = [rootId]
  while (frontier.length) {
    const { data } = await supabaseAdmin.from('companies').select('id').in('parent_company_id', frontier)
    const next = (data || []).map(r => r.id).filter(id => !ids.includes(id))
    if (!next.length) break
    ids.push(...next); frontier = next
  }
  return ids
}

async function resolveRoles(companyId: string) {
  let current: string | null = companyId
  const visited = new Set<string>()
  while (current && !visited.has(current)) {
    visited.add(current)
    const { data } = await supabaseAdmin.from('admin_roles').select('id, name').eq('company_id', current).eq('status', 'active').order('name')
    if (data && data.length) return data
    const { data: comp }: { data: { parent_company_id: string | null } | null } = await supabaseAdmin.from('companies').select('parent_company_id').eq('id', current).maybeSingle()
    current = comp?.parent_company_id || null
  }
  if (!visited.has(MASTER_COMPANY_ID)) {
    const { data } = await supabaseAdmin.from('admin_roles').select('id, name').eq('company_id', MASTER_COMPANY_ID).eq('status', 'active').order('name')
    return data || []
  }
  return []
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })
  const type = req.nextUrl.searchParams.get('type')

  if (type === 'search_person') {
    const q = (req.nextUrl.searchParams.get('q') || '').trim()
    if (!q) return NextResponse.json({ data: null })
    const { data: user } = await supabaseAdmin.from('users').select('id, email').or(`email.ilike.${q},phone.ilike.${q},zy_id.ilike.${q}`).maybeSingle()
    if (!user) return NextResponse.json({ data: null })
    const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('user_id', user.id).ilike('relationship', 'self').maybeSingle()
    return NextResponse.json({ data: { id: user.id, email: user.email, full_name: profile?.full_name || user.email } })
  }

  if (type === 'companies') {
    if (session.is_super_admin) {
      const { data } = await supabaseAdmin.from('companies').select('id, display_name').eq('company_status', 'active').neq('id', MASTER_COMPANY_ID).order('display_name')
      return NextResponse.json({ data })
    }
    const { data: ur } = await supabaseAdmin.from('user_roles').select('company_id').eq('user_id', session.user_id).eq('is_active', true).maybeSingle()
    if (!ur) return NextResponse.json({ data: [] })
    const ids = await getDownlineIds(ur.company_id)
    const { data } = await supabaseAdmin.from('companies').select('id, display_name').eq('company_status', 'active').neq('id', MASTER_COMPANY_ID).in('id', ids).order('display_name')
    return NextResponse.json({ data })
  }

  if (type === 'roles') {
    const companyId = req.nextUrl.searchParams.get('company_id')
    if (!companyId) return NextResponse.json({ data: [] })
    const data = await resolveRoles(companyId)
    return NextResponse.json({ data })
  }

  const page = parseInt(req.nextUrl.searchParams.get('page') || '1')
  const limit = parseInt(req.nextUrl.searchParams.get('limit') || '10')
  const offset = (page - 1) * limit
  const companyFilter = req.nextUrl.searchParams.get('company_id') || ''
  const roleFilter = req.nextUrl.searchParams.get('role_id') || ''
  const statusFilter = req.nextUrl.searchParams.get('status') || ''
  const search = req.nextUrl.searchParams.get('search') || ''

let matchedUserIds: string[] = []
  let matchedCompanyIds: string[] = []
  if (search) {
    const { data: byEmail } = await supabaseAdmin.from('users').select('id').ilike('email', `%${search}%`)
    const { data: byName } = await supabaseAdmin.from('profiles').select('user_id').ilike('full_name', `%${search}%`)
    const { data: byCompany } = await supabaseAdmin.from('companies').select('id').ilike('display_name', `%${search}%`)
    matchedUserIds = [...new Set([...(byEmail || []).map((u: any) => u.id), ...(byName || []).map((p: any) => p.user_id)])]
    matchedCompanyIds = (byCompany || []).map((c: any) => c.id)
    if (!matchedUserIds.length && !matchedCompanyIds.length) return NextResponse.json({ data: [], total: 0 })
  }

  let query = supabaseAdmin.from('user_roles').select('id, user_id, company_id, role_id, is_active, users!user_roles_user_id_fkey(email), companies(display_name), admin_roles(name)', { count: 'exact' })
  if (companyFilter) query = query.eq('company_id', companyFilter)
  if (roleFilter) query = query.eq('role_id', roleFilter)
  if (statusFilter) query = query.eq('is_active', statusFilter === 'active')
  if (search) {
    const parts: string[] = []
    if (matchedUserIds.length) parts.push(`user_id.in.(${matchedUserIds.join(',')})`)
    if (matchedCompanyIds.length) parts.push(`company_id.in.(${matchedCompanyIds.join(',')})`)
    query = query.or(parts.join(','))
  }
  const { data: rows, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: 'Could not load assignments.' }, { status: 500 })

  const userIds = [...new Set((rows || []).map((r: any) => r.user_id))]
  const { data: profiles } = userIds.length ? await supabaseAdmin.from('profiles').select('user_id, full_name').in('user_id', userIds).ilike('relationship', 'self') : { data: [] }
  const nameMap = Object.fromEntries((profiles || []).map((p: any) => [p.user_id, p.full_name]))

  const result = (rows || []).map((r: any) => {
    const u = Array.isArray(r.users) ? r.users[0] : r.users
    const c = Array.isArray(r.companies) ? r.companies[0] : r.companies
    const role = Array.isArray(r.admin_roles) ? r.admin_roles[0] : r.admin_roles
    return { id: r.id, person_name: nameMap[r.user_id] || u?.email || '—', email: u?.email || '—', company_id: r.company_id, company_name: c?.display_name || '—', role_id: r.role_id, role_name: role?.name || '—', is_active: r.is_active }
  })
  return NextResponse.json({ data: result, total: count })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })
  const { user_ids, company_id, role_id } = await req.json()
  if (!company_id) return NextResponse.json({ error: 'Company is required.' }, { status: 400 })
  if (!role_id) return NextResponse.json({ error: 'Role is required.' }, { status: 400 })
  if (!Array.isArray(user_ids) || !user_ids.length) return NextResponse.json({ error: 'Select at least one person.' }, { status: 400 })

  const { data: existing } = await supabaseAdmin.from('user_roles').select('user_id').eq('company_id', company_id).eq('role_id', role_id).in('user_id', user_ids)
  const existingIds = new Set((existing || []).map((r: any) => r.user_id))
  const toInsert = user_ids.filter((id: string) => !existingIds.has(id)).map((id: string) => ({ user_id: id, company_id, role_id, assigned_by: session.user_id, created_by: session.user_id, is_active: true }))
  if (!toInsert.length) return NextResponse.json({ error: 'These people already have this role.' }, { status: 400 })

const { error } = await supabaseAdmin.from('user_roles').insert(toInsert)
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'One or more of these people already have this role.' }, { status: 400 })
    return NextResponse.json({ error: 'Could not assign the role. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ success: true, added: toInsert.length })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })
  const { id, is_active, company_id, role_id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Record is missing.' }, { status: 400 })
  const fields: any = { updated_at: new Date().toISOString() }
  if (typeof is_active === 'boolean') fields.is_active = is_active
  if (company_id) fields.company_id = company_id
  if (role_id) fields.role_id = role_id
const { error } = await supabaseAdmin.from('user_roles').update(fields).eq('id', id)
  if (error) {
    if (error.code === '23505') return NextResponse.json({ error: 'This person already has this role for that company.' }, { status: 400 })
    return NextResponse.json({ error: 'Could not update. Please try again.' }, { status: 500 })
  }
  return NextResponse.json({ success: true })
}