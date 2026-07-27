import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)

  if (searchParams.get('type') === 'all_countries') {
    const { data, error } = await supabaseAdmin.from('country_master').select('id, name').eq('is_active', true).order('name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  if (searchParams.get('type') === 'policy_types') {
    const { data, error } = await supabaseAdmin.from('policies').select('policy_type').neq('status', 'archived')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const types = [...new Set((data || []).map((r: any) => r.policy_type))]
    return NextResponse.json({ data: types })
  }

  // Single record fetch — used by the Edit/View form
  const singleId = searchParams.get('id')
  if (singleId) {
    const { data, error } = await supabaseAdmin.from('policies').select('*').eq('id', singleId).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const policy_type = searchParams.get('policy_type') || ''
  const module_ = searchParams.get('module') || ''
  const country = searchParams.get('country') || ''

  let query = supabaseAdmin.from('policies').select(
    'id, internal_name, display_name, policy_type, modules, country_id, scope, document_url, status, created_at, country_master(id, name)',
    { count: 'exact' }
  )

  if (status) query = query.eq('status', status)
  else query = query.neq('status', 'archived')

  if (search) query = query.or(`internal_name.ilike.%${search}%,display_name.ilike.%${search}%`)
  if (policy_type) query = query.eq('policy_type', policy_type)
  if (module_) query = query.contains('modules', [module_])
  if (country) query = query.eq('country_id', country)

  const { data, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data: data || [], total: count || 0 })
}

async function checkDuplicate(scope: string, country_id: string | null, modules: string[], policy_type: string, excludeId?: string) {
  let q = supabaseAdmin.from('policies').select('id, modules').eq('policy_type', policy_type).eq('scope', scope).neq('status', 'archived').neq('scope', 'unlisted')
  if (scope === 'country') q = q.eq('country_id', country_id)
  if (excludeId) q = q.neq('id', excludeId)
  const { data } = await q
  return (data || []).some(row => (row.modules || []).some((m: string) => modules.includes(m)))
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!session.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { internal_name, display_name, policy_type, modules, country_id, scope, content, document_url } = body

  if (!internal_name || !display_name || !policy_type || !modules?.length) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  if (scope !== 'unlisted' && await checkDuplicate(scope, country_id || null, modules, policy_type)) {
    return NextResponse.json({ error: 'A policy already exists for this Country + Module + Policy Type combination' }, { status: 409 })
  }

  const { data, error } = await supabaseAdmin.from('policies').insert({
    internal_name, display_name, policy_type, modules, country_id: scope === 'country' ? country_id : null, scope: scope || 'global',
    content: content || null, document_url: document_url || null, status: 'active'
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!session.is_super_admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })

  const body = await req.json()
  const { id, action, ...fields } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Archive action — only allowed if scope is 'unlisted' AND status is 'inactive'
  if (action === 'archive') {
    const { data: existing } = await supabaseAdmin.from('policies').select('scope, status').eq('id', id).maybeSingle()
    if (existing?.scope !== 'unlisted' || existing?.status !== 'inactive') {
      return NextResponse.json({ error: 'Only Inactive, Not Listed policies can be deleted' }, { status: 403 })
    }
    const { data, error } = await supabaseAdmin.from('policies').update({ status: 'archived' }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (action === 'restore') {
    const { data, error } = await supabaseAdmin.from('policies').update({ status: 'inactive' }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  // Regular field update — re-check duplicates if country/modules/type changed
  if (fields.modules && fields.policy_type && fields.scope !== 'unlisted') {
    if (await checkDuplicate(fields.scope, fields.country_id || null, fields.modules, fields.policy_type, id)) {
      return NextResponse.json({ error: 'A policy already exists for this Country + Module + Policy Type combination' }, { status: 409 })
    }
  }
  if (fields.scope && fields.scope !== 'country') fields.country_id = null

  const { data, error } = await supabaseAdmin.from('policies').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
