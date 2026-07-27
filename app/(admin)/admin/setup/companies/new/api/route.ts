import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

const ROOT_ID = '11111111-1111-1111-1111-111111111111'

function slugify(name: string) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

async function uniqueSlug(base: string) {
  const { data } = await supabaseAdmin.from('companies').select('slug').ilike('slug', `${base}%`)
  const existing = (data || []).map((r: any) => r.slug)
  if (!existing.includes(base)) return base
  let i = 1
  while (existing.includes(`${base}-${String(i).padStart(2, '0')}`)) i++
  return `${base}-${String(i).padStart(2, '0')}`
}

// Same as uniqueSlug, but ignores the draft's own row so re-saving an
// unchanged slug on an EXISTING draft doesn't get wrongly renamed.
async function uniqueSlugExcluding(base: string, excludeId: string) {
  const { data } = await supabaseAdmin.from('companies').select('id, slug').ilike('slug', `${base}%`)
  const existing = (data || []).filter((r: any) => r.id !== excludeId).map((r: any) => r.slug)
  if (!existing.includes(base)) return base
  let i = 1
  while (existing.includes(`${base}-${String(i).padStart(2, '0')}`)) i++
  return `${base}-${String(i).padStart(2, '0')}`
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const process_id = searchParams.get('process_id')
  const draft_id = searchParams.get('draft_id')
  if (!process_id && !draft_id) return NextResponse.json({ error: 'process_id or draft_id required' }, { status: 400 })
  const query = supabaseAdmin.from('companies').select('*')
  const { data, error } = process_id
    ? await query.eq('process_id', process_id).single()
    : await query.eq('id', draft_id!).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 404 })

  let adminInfo: { admin_user_id?: string; admin_email?: string; admin_user_name?: string; admin_invite_name?: string } = {}
  const { data: roleRow } = await supabaseAdmin.from('user_roles').select('user_id').eq('company_id', data.id).maybeSingle()
  if (roleRow?.user_id) {
    const { data: userRow } = await supabaseAdmin.from('users').select('email').eq('id', roleRow.user_id).maybeSingle()
    const { data: profileRow } = await supabaseAdmin.from('profiles').select('full_name').eq('user_id', roleRow.user_id).ilike('relationship', 'self').maybeSingle()
    adminInfo = { admin_user_id: roleRow.user_id, admin_email: userRow?.email || '', admin_user_name: profileRow?.full_name || '' }
  } else {
    const { data: inviteRow } = await supabaseAdmin.from('invites').select('to_email, invite_name').eq('company_id', data.id).eq('type', 'company_admin_invite').maybeSingle()
    if (inviteRow) adminInfo = { admin_user_id: '', admin_email: inviteRow.to_email || '', admin_user_name: inviteRow.invite_name || '', admin_invite_name: inviteRow.invite_name || '' }
  }
  return NextResponse.json({ data: { ...data, ...adminInfo } })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { action } = body

  if (action === 'check_user_email') {
    const email = (body.email || '').trim().toLowerCase()
    if (!email) return NextResponse.json({ data: null })
    const { data: userData } = await supabaseAdmin.from('users').select('id').eq('email', email).single()
    if (!userData) return NextResponse.json({ data: null })
    const { data: profileData } = await supabaseAdmin.from('profiles').select('full_name').eq('user_id', userData.id).ilike('relationship', 'self').single()
    return NextResponse.json({ data: { id: userData.id, full_name: profileData?.full_name || '' } })
  }

  if (action === 'get_admin_details') {
    const { user_id, company_id } = body
    if (user_id) {
      const { data } = await supabaseAdmin.from('profiles').select('full_name, mobile').eq('user_id', user_id).ilike('relationship', 'self').maybeSingle()
      return NextResponse.json({ data: data || null })
    }
    if (company_id) {
      const { data } = await supabaseAdmin.from('invites').select('invite_name, to_email').eq('company_id', company_id).eq('type', 'company_admin_invite').single()
      return NextResponse.json({ data: data ? { full_name: data.invite_name, mobile: null } : null })
    }
    return NextResponse.json({ data: null })
  }

  if (action === 'get_location_by_id') {
    const { id } = body
    if (!id) return NextResponse.json({ data: null })
    const { data } = await supabaseAdmin.from('locations').select('id, name, level').eq('id', id).single()
    return NextResponse.json({ data: data || null })
  }

  if (action === 'get_address') {
    const { company_id } = body
    if (!company_id) return NextResponse.json({ data: [] })
    const { data, error } = await supabaseAdmin.rpc('get_company_addresses', { p_company_id: company_id })
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  if (action === 'search_pincodes') {
    const { query: q } = body
    if (!q || q.length < 2) return NextResponse.json({ data: [] })
    const { data } = await supabaseAdmin.from('pincodes').select('id, pincode, area, city_id, district_id, state_id, country_id').ilike('pincode', `${q}%`).eq('is_active', true).limit(10)
    return NextResponse.json({ data: data || [] })
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
    const { data, error } = await supabaseAdmin.from('locations').insert({ name, level, parent_id: parent_id || null, country_id: country_id || null, is_active: true, created_by: session.user_id }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (action === 'get_countries') {
    const { data } = await supabaseAdmin.from('country_master').select('id, name').eq('is_active', true).order('name')
    return NextResponse.json({ data: data || [] })
  }

  if (action === 'save_address') {
    const { company_id, address_type, address } = body
    if (!company_id || !address_type) return NextResponse.json({ error: 'company_id and address_type required' }, { status: 400 })
    await supabaseAdmin.from('company_addresses').delete().eq('company_id', company_id).eq('address_type', address_type)
    const { data, error } = await supabaseAdmin.from('company_addresses').insert({ company_id, address_type, ...address, is_active: true }).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (action === 'save_draft') {
    const { draft_id, step_data, wizard_step } = body
    const resolvedData = { ...step_data }
    if (resolvedData.parent_company_id === 'root') resolvedData.parent_company_id = ROOT_ID
    if (resolvedData.reporting_company_id === 'root') resolvedData.reporting_company_id = ROOT_ID

    // Save admin info whenever this step actually contains admin fields —
    // not tied to a specific wizard_step number, so both "Save Draft" and "Next" work.
    if (draft_id && (resolvedData.admin_user_id || resolvedData.admin_email)) {
      const { admin_user_id, admin_email, admin_invite_name, admin_user_name } = resolvedData
      if (admin_user_id) {
        const { data: existingRole } = await supabaseAdmin.from('user_roles').select('id').eq('company_id', draft_id).eq('user_id', admin_user_id).maybeSingle()
        if (!existingRole) {
          const { error: roleErr } = await supabaseAdmin.from('user_roles').insert({ user_id: admin_user_id, company_id: draft_id, role_id: 'f8b0dce1-1d12-4c1b-b52c-10d4ed473f62', assigned_by: session.user_id, created_by: session.user_id })
          if (roleErr) return NextResponse.json({ error: 'Admin role save failed: ' + roleErr.message }, { status: 500 })
        }
      } else if (admin_email) {
        const { data: existingInvite } = await supabaseAdmin.from('invites').select('id').eq('company_id', draft_id).eq('type', 'company_admin_invite').maybeSingle()
        if (!existingInvite) {
          const token = crypto.randomUUID()
          const { error: inviteErr } = await supabaseAdmin.from('invites').insert({ to_email: admin_email, invite_name: admin_invite_name || admin_user_name, type: 'company_admin_invite', company_id: draft_id, token, status: 'pending', created_by: session.user_id, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
          if (inviteErr) return NextResponse.json({ error: 'Admin invite save failed: ' + inviteErr.message }, { status: 500 })
        }
      }
    }

    const stripFields = ['admin_email','admin_invite_name','admin_user_id','admin_user_name',
      'same_address','reg_pincode','reg_area','reg_line1','reg_line2','reg_city_id','reg_city_name',
      'reg_district_id','reg_district_name','reg_state_id','reg_state_name','reg_country_id','reg_landmark',
      'op_pincode','op_area','op_line1','op_line2','op_city_id','op_city_name',
      'op_district_id','op_district_name','op_state_id','op_state_name','op_country_id','op_landmark']
    stripFields.forEach(f => delete resolvedData[f])

    if (draft_id) {
      if (resolvedData.slug) {
        resolvedData.slug = await uniqueSlugExcluding(slugify(resolvedData.slug), draft_id)
      }
      const { data, error } = await supabaseAdmin.from('companies').update({ ...resolvedData, wizard_step, updated_at: new Date().toISOString() }).eq('id', draft_id).select().single()
      if (error) {
        if (error.message.includes('idx_companies_code')) return NextResponse.json({ error: 'Company code already exists. Please use a unique code.' }, { status: 400 })
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ data })
    }

    const slug = await uniqueSlug(slugify(resolvedData.legal_name || 'company'))
    const insertData: any = { ...resolvedData, slug, company_status: 'draft', wizard_step, theme_id: '5ad85f55-6fab-4db2-a8e3-b1507a39de86', created_by: session.user_id }
    if (!insertData.parent_company_id) insertData.parent_company_id = ROOT_ID
    if (!insertData.reporting_company_id) insertData.reporting_company_id = ROOT_ID
    const { data, error } = await supabaseAdmin.from('companies').insert(insertData).select().single()
    if (error) {
      if (error.message.includes('idx_companies_code')) return NextResponse.json({ error: 'Company code already exists. Please use a unique code.' }, { status: 400 })
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ data })
  }

  if (action === 'submit') {
    const { draft_id, admin_user_id, admin_email, admin_invite_name } = body
    const { data: existing } = await supabaseAdmin.from('companies').select('company_status').eq('id', draft_id).single()
    const newStatus = existing?.company_status === 'draft' ? 'pending' : existing?.company_status
    const { data, error } = await supabaseAdmin.from('companies').update({ company_status: newStatus, updated_at: new Date().toISOString() }).eq('id', draft_id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (admin_user_id) {
      const { data: existingRole } = await supabaseAdmin.from('user_roles').select('id').eq('company_id', draft_id).eq('user_id', admin_user_id).maybeSingle()
      if (!existingRole) await supabaseAdmin.from('user_roles').insert({ user_id: admin_user_id, company_id: draft_id, role_id: 'f8b0dce1-1d12-4c1b-b52c-10d4ed473f62', assigned_by: session.user_id, created_by: session.user_id })
    } else if (admin_email) {
      const { data: existingInvite } = await supabaseAdmin.from('invites').select('id').eq('company_id', draft_id).eq('type', 'company_admin_invite').maybeSingle()
      if (!existingInvite) {
        const token = crypto.randomUUID()
        await supabaseAdmin.from('invites').insert({ to_email: admin_email, invite_name: admin_invite_name, type: 'company_admin_invite', company_id: draft_id, token, status: 'pending', created_by: session.user_id, expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() })
      }
    }
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
