// GOES IN: app/(admin)/admin/master/categories/api/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'

async function checkRights(action: 'view' | 'create' | 'edit' | 'delete' | 'view_archived' | 'restore' | 'hard_delete') {
  const cookieStore = await cookies()
  const { session, companyId } = await getActiveCompanyContext(cookieStore)
  if (!session) return false
  if (session.is_super_admin) return true
  if (!companyId) return false
  const rights = await getFullCompanyRights(session.user_id, companyId)
  const r = rights.categories
  if (!r) return false
  if (action === 'view') return !!r.can_view
  if (action === 'create') return !!r.can_create
  if (action === 'edit') return !!r.can_edit
  if (action === 'delete') return !!r.can_delete
  if (action === 'restore') return !!r.can_restore
  if (action === 'view_archived') return !!r.can_archive
  if (action === 'hard_delete') return !!r.can_hard_delete
  return false
}

// Duplicate check — L1 unique across ALL L1s; L2 unique only within its own parent.
// Case-insensitive, checks every status (Active/Inactive/Archived all count).
async function findDuplicate(name: string, level: number, parentId: string | null, excludeId?: string) {
  let q = supabaseAdmin.from('categories').select('id, status').eq('level', level).ilike('name', name)
  if (level === 2) q = q.eq('parent_id', parentId)
  if (excludeId) q = q.neq('id', excludeId)
  const { data } = await q
  return data && data.length ? data[0] : null
}
function duplicateMessage(status: string) {
  if (status === 'active') return 'A category with this name already exists.'
  return `This category already exists in ${status === 'inactive' ? 'Inactive' : 'Archived'} status. Contact admin to activate it.`
  // TODO (future): replace this message with a "Request Activation" ticket flow, same pattern as Registration.
}

export async function GET(req: NextRequest) {
  if (!(await checkRights('view'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { searchParams } = new URL(req.url)
  const page = Number(searchParams.get('page') || '1')
  const limit = Number(searchParams.get('limit') || '20')
  const search = searchParams.get('search') || ''
  const level = searchParams.get('level') || ''
  const parentId = searchParams.get('parent_id') || ''
  const status = searchParams.get('status') || ''

  let query = supabaseAdmin.from('categories').select('*, parent:parent_id(name)', { count: 'exact' })
  if (search) query = query.ilike('name', `%${search}%`)
  if (level) query = query.eq('level', Number(level))
  if (parentId) query = query.eq('parent_id', parentId)

  if (status === 'archived') {
    if (!(await checkRights('view_archived'))) return NextResponse.json({ error: 'You do not have permission to view archived categories.' }, { status: 403 })
    query = query.eq('status', 'archived')
  } else if (status) {
    query = query.eq('status', status)
  } else {
    query = query.neq('status', 'archived')
  }

  const from = (page - 1) * limit
  const { data, count, error } = await query.order('display_order').range(from, from + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data, total: count ?? 0 })
}

export async function POST(req: NextRequest) {
  if (!(await checkRights('create'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const body = await req.json()
  const dup = await findDuplicate(body.name, body.level, body.parent_id || null)
  if (dup) return NextResponse.json({ error: duplicateMessage(dup.status) }, { status: 409 })

  const { data, error } = await supabaseAdmin.from('categories').insert({
    name: body.name, level: body.level, parent_id: body.parent_id || null,
    display_order: body.display_order ?? 0, status: 'active', audience: body.level === 2 ? (body.audience || 'all') : null,
  }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const body = await req.json()

  if (body.action === 'restore') {
    if (!(await checkRights('restore'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { data, error } = await supabaseAdmin.from('categories').update({ status: 'inactive' }).eq('id', body.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (body.status === 'active' || body.status === 'inactive') {
    if (!(await checkRights('edit'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    const { data, error } = await supabaseAdmin.from('categories').update({ status: body.status }).eq('id', body.id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (!(await checkRights('edit'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  if (body.name) {
    const { data: current } = await supabaseAdmin.from('categories').select('level, parent_id').eq('id', body.id).maybeSingle()
    if (current) {
      const dup = await findDuplicate(body.name, current.level, current.parent_id, body.id)
      if (dup) return NextResponse.json({ error: duplicateMessage(dup.status) }, { status: 409 })
    }
  }
  const updatePayload: any = { name: body.name, display_order: body.display_order }
  if (body.audience !== undefined) updatePayload.audience = body.audience
  const { data, error } = await supabaseAdmin.from('categories').update(updatePayload).eq('id', body.id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

// DELETE — soft (default): Active/Inactive -> Archived.
// Hard delete (?hard=true): only when already Archived, requires can_hard_delete, permanently removes the row.
export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const id = searchParams.get('id')
  const hard = searchParams.get('hard') === 'true'
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (hard) {
    if (!(await checkRights('hard_delete'))) return NextResponse.json({ error: 'You do not have permission to permanently delete categories.' }, { status: 403 })
    const { data: existing } = await supabaseAdmin.from('categories').select('status').eq('id', id).maybeSingle()
    if (!existing) return NextResponse.json({ error: 'Category not found' }, { status: 404 })
    if (existing.status !== 'archived') return NextResponse.json({ error: 'Only Archived categories can be permanently deleted.' }, { status: 400 })
    const { error } = await supabaseAdmin.from('categories').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, hard_deleted: true })
  }

  if (!(await checkRights('delete'))) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const { count } = await supabaseAdmin.from('categories').select('*', { count: 'exact', head: true }).eq('parent_id', id)
  if ((count ?? 0) > 0) return NextResponse.json({ error: 'Cannot delete — this category has sub-categories under it' }, { status: 400 })

  const { error } = await supabaseAdmin.from('categories').update({ status: 'archived' }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, archived: true })
}
