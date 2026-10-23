// GOES IN: app/(admin)/admin/setup/roles/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getDownlineIds, getScopedCompanyIds, isOwnRecord } from '@/lib/companyScope'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { hasModuleRight } from '@/lib/adminModuleRights'
import { ADMIN_MODULES as MODULES, ADMIN_MODULE_LABELS as MODULE_LABELS } from '@/lib/adminModules'

const MASTER_COMPANY_ID = '11111111-1111-1111-1111-111111111111'
const SUPER_ADMIN_ROLE_ID = 'd48c4a41-701b-4f70-bcbe-d92020808c00'
const FLAGS = ['can_view', 'can_create', 'can_edit', 'can_delete', 'can_archive', 'can_download_non_sensitive', 'can_download_sensitive', 'can_overwrite_edit', 'can_approve', 'can_restore', 'can_activate', 'can_hard_delete', 'can_sync']

const denied = () => NextResponse.json({ error: 'Not allowed' }, { status: 403 })

async function scopedCompanyIds(req: NextRequest, session: any) {
  const rawContext = decodeURIComponent(req.cookies.get('orgzify_context')?.value || '')
  const [ctxType, ctxId] = rawContext.split(':')
  const processId = ctxType === 'company' ? ctxId : undefined
  return getScopedCompanyIds(session, { processId, module: 'roles' })
}

// One check per request. A Super Admin passes with no database read; others need ONE of these rights on the Roles module.
async function can(req: NextRequest, session: any, ...rights: string[]) {
  for (const r of rights) if (await hasModuleRight(req, session, 'roles', r)) return true
  return false
}

// The company must be inside the person's own scope (a Super Admin may use any company).
async function inScope(req: NextRequest, session: any, companyId: string | null) {
  if (session.is_super_admin) return true
  const ids = await scopedCompanyIds(req, session)
  return !ids || (!!companyId && ids.includes(companyId))
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })
  const type = req.nextUrl.searchParams.get('type')

  if (type === 'companies') {
    if (session.is_super_admin) {
      const { data } = await supabaseAdmin.from('companies').select('id, display_name').eq('company_status', 'active').neq('id', MASTER_COMPANY_ID).order('display_name')
      return NextResponse.json({ data })
    }
    const { data: ur } = await supabaseAdmin.from('user_roles').select('company_id').eq('user_id', session.user_id).eq('status', 'active').maybeSingle()
    if (!ur) return NextResponse.json({ data: [] })
    const ids = await getDownlineIds(ur.company_id)
    const { data } = await supabaseAdmin.from('companies').select('id, display_name').eq('company_status', 'active').neq('id', MASTER_COMPANY_ID).in('id', ids).order('display_name')
    return NextResponse.json({ data })
  }

  if (type === 'role_detail') {
    const roleId = req.nextUrl.searchParams.get('role_id')
    if (!roleId) return NextResponse.json({ error: 'role_id required' }, { status: 400 })
    const { data: role } = await supabaseAdmin.from('admin_roles').select('id, name, company_id, status, is_default').eq('id', roleId).maybeSingle()
    if (!role || !(await inScope(req, session, role.company_id))) return NextResponse.json({ error: 'Role not found' }, { status: 404 })
    const { data: perms } = await supabaseAdmin.from('role_permissions').select('*').eq('role_id', roleId)
    return NextResponse.json({ data: { ...role, permissions: perms || [] } })
  }

  const companyFilter = req.nextUrl.searchParams.get('company_id') || ''
  const statusFilter = req.nextUrl.searchParams.get('status') || ''
  const scopedIds = await scopedCompanyIds(req, session)

  let query = supabaseAdmin.from('admin_roles').select('id, name, status, is_default, company_id, companies(display_name)').neq('id', SUPER_ADMIN_ROLE_ID)
  if (scopedIds) query = query.in('company_id', scopedIds)
  if (companyFilter) query = query.eq('company_id', companyFilter)
  if (statusFilter) query = query.eq('status', statusFilter)
  else query = query.neq('status', 'archived')

  const { data: roles, error } = await query.order('name')
  if (error) return NextResponse.json({ error: 'Could not load roles.' }, { status: 500 })

  const roleIds = (roles || []).map((r: any) => r.id)
  const { data: perms } = roleIds.length ? await supabaseAdmin.from('role_permissions').select(['role_id', 'module', ...FLAGS].join(', ')).in('role_id', roleIds) : { data: [] }

  const modulesByRole: Record<string, string[]> = {}
  ;(perms || []).forEach((p: any) => {
    const hasAny = FLAGS.some(f => p[f])
    if (!hasAny) return
    if (!modulesByRole[p.role_id]) modulesByRole[p.role_id] = []
    modulesByRole[p.role_id].push(MODULE_LABELS[p.module] || p.module)
  })

  const result = (roles || []).map((r: any) => {
    const c = Array.isArray(r.companies) ? r.companies[0] : r.companies
    return { id: r.id, name: r.name, status: r.status || 'active', is_default: !!r.is_default, company_id: r.company_id, company_name: c?.display_name || '—', modules: (modulesByRole[r.id] || []).join(', ') || '—' }
  })
  return NextResponse.json({ data: result })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })
  if (!(await can(req, session, 'can_create'))) return denied()

  const { name, company_id, permissions } = await req.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Role name is required.' }, { status: 400 })
  if (!company_id) return NextResponse.json({ error: 'Company is required.' }, { status: 400 })
  if (!(await inScope(req, session, company_id))) return denied()

  const { data: role, error } = await supabaseAdmin.from('admin_roles').insert({
    name: name.trim(), company_id, status: 'active', is_default: false, created_by: session.user_id
  }).select().single()
  if (error) return NextResponse.json({ error: 'Could not create role.' }, { status: 500 })

  const rows = MODULES.map(m => ({ role_id: role.id, module: m, ...Object.fromEntries(FLAGS.map(f => [f, !!permissions?.[m]?.[f]])) }))
  await supabaseAdmin.from('role_permissions').insert(rows)

  return NextResponse.json({ success: true, data: role })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })

  const body = await req.json()
  const { role_id } = body
  if (!role_id) return NextResponse.json({ error: 'Role is missing.' }, { status: 400 })

  if (role_id === SUPER_ADMIN_ROLE_ID) return NextResponse.json({ error: 'The Super Admin role cannot be edited.' }, { status: 403 })
  if (!(await (body.restore ? can(req, session, 'can_restore', 'can_edit') : can(req, session, 'can_edit')))) return denied()

  const { data: target } = await supabaseAdmin.from('admin_roles').select('company_id').eq('id', role_id).maybeSingle()
  if (!target || !(await inScope(req, session, target.company_id))) return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  const activeCompanyId = await getActiveCompanyId(req.cookies)
  if (isOwnRecord(activeCompanyId, target.company_id)) {
    return NextResponse.json({ error: 'You cannot edit your own company\'s role.' }, { status: 403 })
  }

  if (body.restore) {
    const { error } = await supabaseAdmin.from('admin_roles').update({ status: 'active', updated_at: new Date().toISOString() }).eq('id', role_id)
    if (error) return NextResponse.json({ error: 'Could not restore role.' }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  const { name, company_id, status, permissions } = body
  if (company_id && !(await inScope(req, session, company_id))) return denied()
  const fields: any = { updated_at: new Date().toISOString() }
  if (name?.trim()) fields.name = name.trim()
  if (company_id) fields.company_id = company_id
  if (status) fields.status = status

  const { error } = await supabaseAdmin.from('admin_roles').update(fields).eq('id', role_id)
  if (error) return NextResponse.json({ error: 'Could not update role.' }, { status: 500 })

  if (permissions) {
    await supabaseAdmin.from('role_permissions').delete().eq('role_id', role_id)
    const rows = MODULES.map(m => ({ role_id, module: m, ...Object.fromEntries(FLAGS.map(f => [f, !!permissions?.[m]?.[f]])) }))
    await supabaseAdmin.from('role_permissions').insert(rows)
  }

  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })
  if (!(await can(req, session, 'can_delete', 'can_archive'))) return denied()

  const { role_id } = await req.json()
  if (!role_id) return NextResponse.json({ error: 'Role is missing.' }, { status: 400 })

  if (role_id === SUPER_ADMIN_ROLE_ID) return NextResponse.json({ error: 'The Super Admin role cannot be deleted.' }, { status: 403 })

  const { data: role } = await supabaseAdmin.from('admin_roles').select('is_default, company_id').eq('id', role_id).maybeSingle()
  if (!role || !(await inScope(req, session, role.company_id))) return NextResponse.json({ error: 'Role not found' }, { status: 404 })
  if (role.is_default) return NextResponse.json({ error: 'The default role cannot be deleted.' }, { status: 400 })

  const { error } = await supabaseAdmin.from('admin_roles').update({ status: 'archived', updated_at: new Date().toISOString() }).eq('id', role_id)
  if (error) return NextResponse.json({ error: 'Could not delete role.' }, { status: 500 })
  return NextResponse.json({ success: true })
}
