// GOES IN: app/(admin)/admin/ecosystem/entities/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { sendEntityStatusEmail } from '@/lib/sendEntityStatusEmail'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import { getScopedCompanyIds } from '@/lib/companyScope'

type Rights = Record<string, boolean> | 'all'
const has = (r: Rights, right: string) => r === 'all' || !!r[right]
const denied = (msg = 'Not allowed') => NextResponse.json({ error: msg }, { status: 403 })

// The person's rights on the Entities module, read ONCE per request. A Super Admin needs no database read.
async function entityRights(req: NextRequest, session: any): Promise<Rights> {
  if (session.is_super_admin) return 'all'
  const activeCompanyId = await getActiveCompanyId(req.cookies)
  if (!activeCompanyId) return {}
  return ((await getFullCompanyRights(session.user_id, activeCompanyId))['entities'] as any) || {}
}

// Hierarchy: a person sees and changes only entities reported to companies inside their own scope (Super Admin: all).
async function scopedIds(req: NextRequest, session: any): Promise<string[] | null> {
  if (session.is_super_admin) return null
  const rawContext = decodeURIComponent(req.cookies.get('orgzify_context')?.value || '')
  const [ctxType, ctxId] = rawContext.split(':')
  return getScopedCompanyIds(session, { processId: ctxType === 'company' ? ctxId : undefined, module: 'entities' })
}
const inScope = (ids: string[] | null, companyId: string | null) => !ids || (!!companyId && ids.includes(companyId))

// Cosmetic-only URL slug — same rule used everywhere this link is built.
const slugify = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

async function getEntityOwnerContact(entityId: string) {
  const { data: entity } = await supabaseAdmin.from('entities').select('user_id, display_name').eq('id', entityId).maybeSingle()
  if (!entity) return null
  const { data: user } = await supabaseAdmin.from('users').select('email').eq('id', entity.user_id).maybeSingle()
  return { email: user?.email || '', name: entity.display_name }
}

// Same lookup already used for the Reporting Office contact panel — one country-specific
// Customer Care address per module, reused here so status emails point to the right place.
async function getEntitySupportEmail(entityId: string): Promise<string | undefined> {
  const { data: entity } = await supabaseAdmin.from('entities').select('confirmed_country_id').eq('id', entityId).maybeSingle()
  if (!entity?.confirmed_country_id) return undefined
  const { data: contact } = await supabaseAdmin.from('module_country_contacts')
    .select('customer_care_email').eq('module_code', 'EntityRegistration').eq('country_id', entity.confirmed_country_id).eq('status', 'active').maybeSingle()
  return contact?.customer_care_email || undefined
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)

  if (searchParams.get('type') === 'status_reasons') {
    const statusCode = searchParams.get('status_code') || 'rejected'
    const { data } = await supabaseAdmin.from('entity_status_reasons')
      .select('id, reason_label').eq('status_code', statusCode).eq('is_active', true).order('sort_order')
    return NextResponse.json({ data: data || [] })
  }

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const reportingCompanyId = searchParams.get('reporting_company_id') || ''
  const scoped = await scopedIds(req, session)

  let query = supabaseAdmin.from('entities').select(
    'id, process_id, slug, legal_name, display_name, reporting_company_id, status, is_approved, created_at',
    { count: 'exact' }
  )
  if (scoped) query = query.in('reporting_company_id', scoped)

  if (search) query = query.or(`legal_name.ilike.%${search}%,display_name.ilike.%${search}%,process_id.ilike.%${search}%`)

  if (status === 'archived') {
    if (!has(await entityRights(req, session), 'can_archive')) return denied('You do not have permission to view archived entities.')
    query = query.eq('status', 'archived')
  } else if (status) {
    query = query.eq('status', status)
  } else {
    query = query.neq('status', 'archived')
  }

  if (reportingCompanyId) query = query.eq('reporting_company_id', reportingCompanyId)

  const { data: rows, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json({ data: [], total: 0 })

  const companyIds = [...new Set(rows.map((r: any) => r.reporting_company_id).filter(Boolean))]
  const { data: companies } = companyIds.length
    ? await supabaseAdmin.from('companies').select('id, display_name').in('id', companyIds)
    : { data: [] }
  const companyMap = Object.fromEntries((companies || []).map((c: any) => [c.id, c.display_name]))

  const data = rows.map((r: any) => ({
    ...r,
    reporting_company: r.reporting_company_id ? { display_name: companyMap[r.reporting_company_id] || '' } : null
  }))

  return NextResponse.json({ data, total: count })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { id, expected_status, reason_id, reason_note, ...fields } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // One rights read, then the entity must be inside the person's own scope. Anyone else is told it was not found.
  const rights = await entityRights(req, session)
  if (!['can_edit', 'can_approve', 'can_activate', 'can_restore'].some(r => has(rights, r))) return denied('You do not have permission to change entities.')
  const { data: current } = await supabaseAdmin.from('entities').select('status, reporting_company_id').eq('id', id).maybeSingle()
  if (!current || !inScope(await scopedIds(req, session), current.reporting_company_id)) return NextResponse.json({ error: 'Entity not found' }, { status: 404 })

  if (fields.action === 'restore') {
    if (!has(rights, 'can_restore')) return denied('You do not have permission to restore entities.')
    const { error } = await supabaseAdmin.from('entities')
      .update({ status: 'inactive', previous_status: null, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: { status: 'inactive' } })
  }

  if (fields.status === 'active' && !has(rights, 'can_activate')) return denied('You do not have permission to activate entities.')

  // The owner and the identity columns can never be changed from here.
  for (const k of ['user_id', 'process_id', 'entity_unique_id', 'created_by', 'created_at']) delete (fields as any)[k]

  // Safety check — someone else may have already actioned this entity from
  // the other screen (Entities list vs future Tickets list). If so, we never
  // apply this action twice: we just log it and make sure the ticket is closed.
  if (fields.status && expected_status && current.status !== expected_status) {
    await supabaseAdmin.from('entity_review_notes').insert({
      entity_id: id, action_type: 'conflict', created_by: session.user_id,
      note: `Attempted to set status to '${fields.status}' but entity was already '${current.status}'.`
    })
    return NextResponse.json({ error: 'conflict', current_status: current.status }, { status: 409 })
  }

  if (['rejected', 'suspended', 'blocked'].includes(fields.status) && !reason_id && !reason_note) {
    return NextResponse.json({ error: 'A reason is required' }, { status: 400 })
  }

  fields.updated_at = new Date().toISOString()
  if (fields.status === 'active') { fields.is_approved = true; fields.approved_by = session.user_id; fields.approved_at = new Date().toISOString() }

  const { data, error } = await supabaseAdmin.from('entities').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  if (fields.status === 'active') {
    const contact = await getEntityOwnerContact(id)
    const supportEmail = await getEntitySupportEmail(id)
    if (contact?.email) {
      if (expected_status === 'pending') {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
        await sendEntityStatusEmail({
          to: contact.email, name: contact.name, type: 'approved', supportEmail,
          buttonLabel: 'View Dashboard', buttonUrl: `${baseUrl}/biz/${slugify(contact.name)}/dashboard`
        })
      } else if (expected_status === 'suspended' || expected_status === 'blocked') {
        await sendEntityStatusEmail({ to: contact.email, name: contact.name, type: 'reactivated', supportEmail })
      }
    }
  }

  if (['rejected', 'suspended', 'blocked'].includes(fields.status)) {
    const actionType = fields.status === 'rejected' ? 'reject' : fields.status === 'suspended' ? 'suspend' : 'block'
    let reasonLabel = reason_note || ''
    if (reason_id) {
      const { data: reasonRow } = await supabaseAdmin.from('entity_status_reasons').select('reason_label').eq('id', reason_id).maybeSingle()
      reasonLabel = reasonRow?.reason_label ? (reason_note ? `${reasonRow.reason_label} — ${reason_note}` : reasonRow.reason_label) : reasonLabel
    }
    await supabaseAdmin.from('entity_review_notes').insert({
      entity_id: id, action_type: actionType, reason_id: reason_id || null, note: reason_note || null, created_by: session.user_id
    })

    const contact = await getEntityOwnerContact(id)
    const supportEmail = await getEntitySupportEmail(id)
    if (contact?.email) {
      await sendEntityStatusEmail({ to: contact.email, name: contact.name, type: fields.status, reason: reasonLabel, supportEmail })
    }
  }

  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  if (!has(await entityRights(req, session), 'can_delete')) return denied('You do not have permission to delete entities.')

  const { data: entity } = await supabaseAdmin.from('entities').select('status, reporting_company_id').eq('id', id).maybeSingle()
  if (!entity || !inScope(await scopedIds(req, session), entity.reporting_company_id)) return NextResponse.json({ error: 'Entity not found' }, { status: 404 })

  // FUTURE: block delete here if entity has active events or pending
  // payments owed to Orgzify — not built yet (Events/Payments modules pending).

  if (entity.status === 'draft') {
    // Hard delete — draft entities have no compliance value yet, so we
    // remove them and any partial data completely.
    await supabaseAdmin.from('entity_policy_acceptance').delete().eq('entity_id', id)
    await supabaseAdmin.from('entity_documents').delete().eq('entity_id', id)
    await supabaseAdmin.from('entity_addresses').delete().eq('entity_id', id)
    const { error } = await supabaseAdmin.from('entities').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true, hard_deleted: true })
  }

  // Soft delete — archive, keep everything intact for compliance/audit,
  // remembering the prior status so Restore can put it back correctly.
  const { error } = await supabaseAdmin.from('entities')
    .update({ previous_status: entity.status, status: 'archived', updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true, archived: true })
}
