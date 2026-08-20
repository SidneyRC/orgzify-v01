// THIS FILE GOES IN: app/(admin)/admin/sponsors/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { hasModuleRight } from '@/lib/adminModuleRights'

const MODULE_CODE = 'sponsors'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const type = req.nextUrl.searchParams.get('type')
  if (type === 'status_reasons') {
    const statusCode = req.nextUrl.searchParams.get('status_code')
    const { data, error } = await supabaseAdmin.from('module_status_reasons').select('id, reason_label')
      .eq('module_code', MODULE_CODE).eq('status_code', statusCode).eq('is_active', true).order('sort_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  const page = Number(req.nextUrl.searchParams.get('page') || '1')
  const limit = Number(req.nextUrl.searchParams.get('limit') || '20')
  const search = req.nextUrl.searchParams.get('search')
  const status = req.nextUrl.searchParams.get('status')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabaseAdmin.from('sponsors').select('id, name, logo_url, status, is_enabled, created_at', { count: 'exact' }).order('created_at', { ascending: false })
  if (search) query = query.ilike('name', `%${search}%`)
  if (status) query = query.eq('status', status)
  const { data, error, count } = await query.range(from, to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [], total: count || 0 })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await hasModuleRight(req, session, MODULE_CODE, 'can_create'))) {
    return NextResponse.json({ error: 'You do not have permission to add sponsors.' }, { status: 403 })
  }

  const { name, logo_url } = await req.json()
  if (!name || !logo_url) return NextResponse.json({ error: 'Name and logo are required' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('sponsors').insert({ name, logo_url, status: 'approved', is_enabled: true, created_by: session.user_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { id, status, reason_id, reason_note, is_enabled, name, logo_url } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (status) {
    if (!['approved', 'rejected'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    if (!(await hasModuleRight(req, session, MODULE_CODE, 'can_approve'))) {
      return NextResponse.json({ error: 'You do not have permission to approve or reject sponsors.' }, { status: 403 })
    }
    const { error } = await supabaseAdmin.from('sponsors').update({ status }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (status === 'rejected') {
      await supabaseAdmin.from('module_review_notes').insert({
        module_code: MODULE_CODE, record_id: id, action_type: 'reject', reason_id: reason_id || null, note: reason_note || null, created_by: session.user_id
      })
    }
    return NextResponse.json({ data: true })
  }

  if (!(await hasModuleRight(req, session, MODULE_CODE, 'can_edit'))) {
    return NextResponse.json({ error: 'You do not have permission to edit sponsors.' }, { status: 403 })
  }

  if (typeof is_enabled === 'boolean') {
    const { error } = await supabaseAdmin.from('sponsors').update({ is_enabled }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: true })
  }

  if (name || logo_url) {
    const updates: Record<string, string> = {}
    if (name) updates.name = name
    if (logo_url) updates.logo_url = logo_url
    const { error } = await supabaseAdmin.from('sponsors').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: true })
  }

  return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await hasModuleRight(req, session, MODULE_CODE, 'can_hard_delete'))) {
    return NextResponse.json({ error: 'You do not have permission to delete sponsors.' }, { status: 403 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: sponsor } = await supabaseAdmin.from('sponsors').select('status').eq('id', id).maybeSingle()
  if (!sponsor) return NextResponse.json({ error: 'Sponsor not found' }, { status: 404 })
  if (sponsor.status === 'approved') {
    return NextResponse.json({ error: 'Approved sponsors cannot be deleted yet — this will be enabled once event-linkage checks are built.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('sponsors').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: true })
}
