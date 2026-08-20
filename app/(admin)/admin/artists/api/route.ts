// THIS FILE GOES IN: app/(admin)/admin/artists/api/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { hasModuleRight } from '@/lib/adminModuleRights'

const MODULE_CODE = 'artists'

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
  if (type === 'specialities') {
    const { data, error } = await supabaseAdmin.from('artist_specialities').select('id, name').eq('status', 'active').order('display_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  const page = Number(req.nextUrl.searchParams.get('page') || '1')
  const limit = Number(req.nextUrl.searchParams.get('limit') || '20')
  const search = req.nextUrl.searchParams.get('search')
  const status = req.nextUrl.searchParams.get('status')
  const from = (page - 1) * limit
  const to = from + limit - 1

  let query = supabaseAdmin.from('artists')
    .select('id, name, photo_url, status, is_enabled, created_at, artist_specialities(name)', { count: 'exact' })
    .order('created_at', { ascending: false })
  if (search) query = query.ilike('name', `%${search}%`)
  if (status) query = query.eq('status', status)
  const { data, error, count } = await query.range(from, to)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  const rows = (data || []).map((r: any) => ({ ...r, speciality_name: (Array.isArray(r.artist_specialities) ? r.artist_specialities[0] : r.artist_specialities)?.name || '—' }))
  return NextResponse.json({ data: rows, total: count || 0 })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await hasModuleRight(req, session, MODULE_CODE, 'can_create'))) {
    return NextResponse.json({ error: 'You do not have permission to add artists.' }, { status: 403 })
  }

  const { name, photo_url, speciality_id } = await req.json()
  if (!name || !photo_url || !speciality_id) return NextResponse.json({ error: 'Name, photo and speciality are required' }, { status: 400 })

  const { data, error } = await supabaseAdmin.from('artists')
    .insert({ name, photo_url, speciality_id, status: 'active', is_enabled: true, created_by: session.user_id }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { id, status, reason_id, reason_note, is_enabled, name, photo_url, speciality_id } = body
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  if (status) {
    if (!['active', 'rejected'].includes(status)) return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
    if (!(await hasModuleRight(req, session, MODULE_CODE, 'can_approve'))) {
      return NextResponse.json({ error: 'You do not have permission to approve or reject artists.' }, { status: 403 })
    }
    const { error } = await supabaseAdmin.from('artists').update({ status }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (status === 'rejected') {
      await supabaseAdmin.from('module_review_notes').insert({
        module_code: MODULE_CODE, record_id: id, action_type: 'reject', reason_id: reason_id || null, note: reason_note || null, created_by: session.user_id
      })
    }
    return NextResponse.json({ data: true })
  }

  if (!(await hasModuleRight(req, session, MODULE_CODE, 'can_edit'))) {
    return NextResponse.json({ error: 'You do not have permission to edit artists.' }, { status: 403 })
  }

  if (typeof is_enabled === 'boolean') {
    const { error } = await supabaseAdmin.from('artists').update({ is_enabled }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: true })
  }

  if (name || photo_url || speciality_id) {
    const updates: Record<string, string> = {}
    if (name) updates.name = name
    if (photo_url) updates.photo_url = photo_url
    if (speciality_id) updates.speciality_id = speciality_id
    const { error } = await supabaseAdmin.from('artists').update(updates).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: true })
  }

  return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await hasModuleRight(req, session, MODULE_CODE, 'can_hard_delete'))) {
    return NextResponse.json({ error: 'You do not have permission to delete artists.' }, { status: 403 })
  }

  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

  const { data: artist } = await supabaseAdmin.from('artists').select('status').eq('id', id).maybeSingle()
  if (!artist) return NextResponse.json({ error: 'Artist not found' }, { status: 404 })
  if (artist.status === 'active') {
    return NextResponse.json({ error: 'Approved artists cannot be deleted yet — this will be enabled once event-linkage checks are built.' }, { status: 400 })
  }

  const { error } = await supabaseAdmin.from('artists').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: true })
}
