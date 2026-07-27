import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getScopedCompanyIds, isOwnRecord } from '@/lib/companyScope'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import { sendCompanyInvite, sendCompanyDeactivated, sendCompanyReactivated } from '@/lib/sendInvite'

const SUPER_ADMIN_ROLE_ID = 'd48c4a41-701b-4f70-bcbe-d92020808c00'

async function isSuperAdmin(user_id: string) {
  const { data } = await supabaseAdmin
    .from('user_roles').select('id').eq('user_id', user_id).eq('role_id', SUPER_ADMIN_ROLE_ID).eq('is_active', true).maybeSingle()
  return !!data
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''

  // Active companies list for parent/reporting dropdowns
  if (searchParams.get('type') === 'active_companies') {
    const superAdmin = await isSuperAdmin(session.user_id)

    if (superAdmin) {
      const { data, error } = await supabaseAdmin
        .from('companies').select('id, display_name').eq('company_status', 'active').order('display_name')
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: data || [], isSuperAdmin: true })
    }

    const rawContextDD = decodeURIComponent(req.cookies.get('orgzify_context')?.value || '')
    const [ctxTypeDD, ctxIdDD] = rawContextDD.split(':')
    const processIdDD = ctxTypeDD === 'company' ? ctxIdDD : undefined
    const scopedIdsDD = await getScopedCompanyIds(session, { processId: processIdDD, module: 'companies' })

    let ddQuery = supabaseAdmin.from('companies').select('id, display_name').eq('company_status', 'active').order('display_name')
    if (scopedIdsDD) ddQuery = ddQuery.in('id', scopedIdsDD)
    const { data, error } = await ddQuery
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [], isSuperAdmin: false })
  }

// Countries that have companies with addresses
  if (searchParams.get('type') === 'all_countries') {
    const { data, error } = await supabaseAdmin
      .from('company_addresses').select('country_id, country_master(id, name)').not('country_id', 'is', null)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const seen = new Set()
    const countries = (data || []).filter((r: any) => {
      if (!r.country_master || seen.has(r.country_id)) return false
      seen.add(r.country_id); return true
    }).map((r: any) => ({ id: r.country_master.id, name: r.country_master.name }))
    return NextResponse.json({ data: countries })
  }

  // Scoping: read the active context cookie (set automatically on company pages)
  const rawContext = decodeURIComponent(req.cookies.get('orgzify_context')?.value || '')
  const [ctxType, ctxId] = rawContext.split(':')
  const processId = ctxType === 'company' ? ctxId : undefined
  const scopedIds = await getScopedCompanyIds(session, { processId, module: 'companies' })

  let query = supabaseAdmin.from('companies').select(
    'id, legal_name, display_name, slug, company_type, branch_type, company_status, created_at, parent_company_id, process_id, company_code',
    { count: 'exact' }
  )
  if (scopedIds) query = query.in('id', scopedIds)

  const country = searchParams.get('country') || ''
const company_type = searchParams.get('company_type') || ''
const branch_type = searchParams.get('branch_type') || ''
if (search) query = query.or(`legal_name.ilike.%${search}%,display_name.ilike.%${search}%,slug.ilike.%${search}%,process_id.ilike.%${search}%,company_code.ilike.%${search}%`)
if (status) query = query.eq('company_status', status)
if (country) query = query.eq('country_id', country)
if (company_type) query = query.eq('company_type', company_type)
if (branch_type) query = query.eq('branch_type', branch_type)

  const { data: rows, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json({ data: [], total: 0 })

  const parentIds = [...new Set(rows.map((r: any) => r.parent_company_id).filter(Boolean))]
  const { data: parents } = parentIds.length
    ? await supabaseAdmin.from('companies').select('id, display_name').in('id', parentIds)
    : { data: [] }
  const parentMap = Object.fromEntries((parents || []).map((p: any) => [p.id, p.display_name]))

  const data = rows.map((r: any) => ({
    ...r, parent: r.parent_company_id ? { display_name: parentMap[r.parent_company_id] || '' } : null
  }))

  return NextResponse.json({ data, total: count })
}

const COMPANY_ADMIN_ROLE_ID = 'f8b0dce1-1d12-4c1b-b52c-10d4ed473f62'

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { id, previous_status, ...fields } = body

  const activeCompanyId = await getActiveCompanyId(req.cookies)

  if (activeCompanyId) {
    const rights = await getFullCompanyRights(session.user_id, activeCompanyId)
    if (!rights.companies?.can_edit) {
      return NextResponse.json({ error: 'You do not have permission to edit companies' }, { status: 403 })
    }
  }

  if (isOwnRecord(activeCompanyId, id)) {
    return NextResponse.json({ error: 'You cannot edit your own company\'s record' }, { status: 403 })
  }

  fields.updated_at = new Date().toISOString()

  const { data, error } = await supabaseAdmin.from('companies').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://orgzify.com'
  const companyName = data.display_name || data.legal_name || 'Your Company'
  const companySlug = data.slug || ''
  const dashboardLink = `${baseUrl}/company/${companySlug}/dashboard`

  const getRegisteredAdmin = async () => {
    const { data: roleRow } = await supabaseAdmin
      .from('user_roles').select('user_id').eq('company_id', id).eq('role_id', COMPANY_ADMIN_ROLE_ID).eq('is_active', true).maybeSingle()
    if (!roleRow) return null
    const { data: adminUser } = await supabaseAdmin.from('users').select('email').eq('id', roleRow.user_id).maybeSingle()
    const { data: adminProfile } = await supabaseAdmin.from('profiles').select('full_name').eq('user_id', roleRow.user_id).ilike('relationship', 'self').maybeSingle()
    if (!adminUser?.email) return null
    const firstName = adminProfile?.full_name?.split(' ').find((p: string) => !p.endsWith('.')) ?? 'there'
    return { email: adminUser.email, name: firstName }
  }

  if (fields.company_status === 'active' && previous_status !== 'active') {
    if (previous_status === 'inactive') {
      const admin = await getRegisteredAdmin()
      if (admin) await sendCompanyReactivated({ to: admin.email, toName: admin.name, companyName, dashboardLink })
    } else {
        
      const admin = await getRegisteredAdmin()
      if (admin) {
        await sendCompanyInvite({ to: admin.email, toName: admin.name, companyName, dashboardLink, isRegistered: true })
      } else {
        const { data: invite } = await supabaseAdmin
          .from('invites').select('to_email, invite_name, token').eq('company_id', id).eq('type', 'company_admin_invite').eq('status', 'pending').maybeSingle()

        if (invite) {
          const toName = invite.invite_name || 'there'
          const registerLink = `${baseUrl}/register?invite=${invite.token}`
          await sendCompanyInvite({ to: invite.to_email, toName, companyName, dashboardLink, isRegistered: false, registerLink })
        }
      }
    }
  }

  if (fields.company_status === 'inactive') {
    const admin = await getRegisteredAdmin()
    if (admin) await sendCompanyDeactivated({ to: admin.email, toName: admin.name, companyName })
  }

  return NextResponse.json({ data })
}
