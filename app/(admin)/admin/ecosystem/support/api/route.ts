import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getScopedCompanyIds } from '@/lib/companyScope'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import { sendEntityStatusEmail } from '@/lib/sendEntityStatusEmail'
import { getTicketSummary } from '@/lib/getTicketSummary'

const SUB_CATEGORIES = ['New Submission', 'Unmapped Reporting Office']

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { searchParams } = new URL(req.url)

  if (searchParams.get('type') === 'activity') {
    const ticketId = searchParams.get('ticket_id')
    if (!ticketId) return NextResponse.json({ data: [] })
    const { data } = await supabaseAdmin.from('ticket_activity')
      .select('id, activity_type, message, visible_to_entity, is_edited, created_by, created_at').eq('ticket_id', ticketId).order('created_at')
    return NextResponse.json({ data: data || [] })
  }

  if (searchParams.get('type') === 'entity_status') {
    const entityId = searchParams.get('entity_id')
    if (!entityId) return NextResponse.json({ error: 'Missing entity_id' }, { status: 400 })
    const { data } = await supabaseAdmin.from('entities').select('status').eq('id', entityId).maybeSingle()
    return NextResponse.json({ status: data?.status || '' })
  }

  if (searchParams.get('type') === 'summary') {
    const summary = await getTicketSummary(session)
    return NextResponse.json(summary)
  }

  if (searchParams.get('type') === 'meta') {
    const { data: statuses } = await supabaseAdmin.from('ticket_status_master').select('code, label').eq('is_active', true).order('sort_order')
    return NextResponse.json({ statuses: statuses || [], subCategories: SUB_CATEGORIES })
  }

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || ''
  const subCategory = searchParams.get('sub_category') || ''
  const status = searchParams.get('status') || ''
  const countryId = searchParams.get('country_id') || ''
  const stateId = searchParams.get('state_id') || ''
  const cityId = searchParams.get('city_id') || ''
  const reportingCompanyId = searchParams.get('reporting_company_id') || ''

  const scopedIds = await getScopedCompanyIds(session)

  let entityQuery = supabaseAdmin.from('entities').select('id, process_id, legal_name, display_name, reporting_company_id, confirmed_country_id')
  if (search) entityQuery = entityQuery.or(`legal_name.ilike.%${search}%,display_name.ilike.%${search}%,process_id.ilike.%${search}%`)
  if (countryId) entityQuery = entityQuery.eq('confirmed_country_id', countryId)
  if (reportingCompanyId) entityQuery = entityQuery.eq('reporting_company_id', reportingCompanyId)
  if (scopedIds) entityQuery = entityQuery.in('reporting_company_id', scopedIds)

  if (stateId || cityId) {
    let addrQuery = supabaseAdmin.from('entity_addresses').select('entity_id').eq('address_type', 'registered')
    if (stateId) addrQuery = addrQuery.eq('state', stateId)
    if (cityId) addrQuery = addrQuery.eq('city', cityId)
    const { data: addrRows } = await addrQuery
    const matchingEntityIds = (addrRows || []).map((a: any) => a.entity_id)
    entityQuery = entityQuery.in('id', matchingEntityIds.length ? matchingEntityIds : ['00000000-0000-0000-0000-000000000000'])
  }

  const { data: entityRows } = await entityQuery
  const entityIds = (entityRows || []).map((e: any) => e.id)
  if (entityIds.length === 0) return NextResponse.json({ data: [], total: 0 })

  let ticketQuery = supabaseAdmin.from('tickets').select('id, category, sub_category, status, entity_id, created_at', { count: 'exact' }).in('entity_id', entityIds)
  if (subCategory) ticketQuery = ticketQuery.eq('sub_category', subCategory)
  if (status) ticketQuery = ticketQuery.eq('status', status)

  const { data: rows, count, error } = await ticketQuery.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const companyIds = [...new Set((entityRows || []).map((e: any) => e.reporting_company_id).filter(Boolean))]
  const { data: companies } = companyIds.length ? await supabaseAdmin.from('companies').select('id, display_name').in('id', companyIds) : { data: [] }
  const companyMap = Object.fromEntries((companies || []).map((c: any) => [c.id, c.display_name]))

  const countryIds = [...new Set((entityRows || []).map((e: any) => e.confirmed_country_id).filter(Boolean))]
  const { data: countries } = countryIds.length ? await supabaseAdmin.from('country_master').select('id, name').in('id', countryIds) : { data: [] }
  const countryMap = Object.fromEntries((countries || []).map((c: any) => [c.id, c.name]))

  const entityMap = Object.fromEntries((entityRows || []).map((e: any) => [e.id, e]))

  const data = (rows || []).map((r: any) => {
    const ent = entityMap[r.entity_id] || {}
    return {
      ...r,
      entity: { process_id: ent.process_id, display_name: ent.display_name, legal_name: ent.legal_name, country_name: countryMap[ent.confirmed_country_id] || '' },
      reporting_company: ent.reporting_company_id ? { display_name: companyMap[ent.reporting_company_id] || '' } : null
    }
  })

  return NextResponse.json({ data, total: count || 0 })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { ticket_id, action, message, visible_to_entity, new_status, activity_id, new_message } = body
  if (!ticket_id || !action) return NextResponse.json({ error: 'Missing ticket_id or action' }, { status: 400 })

  const { data: ticket } = await supabaseAdmin.from('tickets').select('id, entity_id, sub_category').eq('id', ticket_id).maybeSingle()
  if (!ticket) return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })

  if (action === 'edit_note') {
    let allowed = session.is_super_admin
    if (!allowed) {
      const activeCompanyId = await getActiveCompanyId(req.cookies)
      if (activeCompanyId) {
        const rights = await getFullCompanyRights(session.user_id, activeCompanyId)
        allowed = !!rights['support']?.can_overwrite_edit
      }
    }
    if (!allowed) return NextResponse.json({ error: 'Not authorised' }, { status: 403 })
    if (!activity_id || !new_message) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const { data: existing } = await supabaseAdmin.from('ticket_activity').select('message, is_edited, original_message').eq('id', activity_id).maybeSingle()
    if (!existing) return NextResponse.json({ error: 'Note not found' }, { status: 404 })
    await supabaseAdmin.from('ticket_activity').update({
      message: new_message, is_edited: true, original_message: existing.is_edited ? existing.original_message : existing.message
    }).eq('id', activity_id)
    return NextResponse.json({ success: true })
  }

  if (message) {
    await supabaseAdmin.from('ticket_activity').insert({
      ticket_id, activity_type: action === 'change_status' ? 'status_change' : 'note', message,
      visible_to_entity: !!visible_to_entity, created_by: session.user_id
    })
  }

  if (action === 'change_status' && new_status) {
    const patch: any = { status: new_status, updated_at: new Date().toISOString() }
    if (new_status === 'Closed') patch.closed_at = new Date().toISOString()
    await supabaseAdmin.from('tickets').update(patch).eq('id', ticket_id)

    const triggersOwnerNotice =
      (ticket.sub_category === 'Unmapped Reporting Office' && new_status === 'Closed') ||
      (ticket.sub_category === 'New Submission' && new_status === 'Correction')

    if (triggersOwnerNotice) {
      const ownerNoticeText = (message || '').trim()
      await supabaseAdmin.from('entities').update({
        status: 'draft', owner_notice: ownerNoticeText || null, updated_at: new Date().toISOString()
      }).eq('id', ticket.entity_id)

      const { data: entity } = await supabaseAdmin.from('entities').select('user_id, display_name, process_id').eq('id', ticket.entity_id).maybeSingle()
      if (entity) {
        const { data: user } = await supabaseAdmin.from('users').select('email').eq('id', entity.user_id).maybeSingle()
        if (user?.email) {
          const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
          const emailType = ticket.sub_category === 'Unmapped Reporting Office' ? 'complete_registration' : 'correction'
          await sendEntityStatusEmail({
            to: user.email, name: entity.display_name, type: emailType, reason: ownerNoticeText || undefined,
            buttonLabel: 'Continue Registration', buttonUrl: `${baseUrl}/biz/register?ref=${entity.process_id}`
          })
        }
      }
    }
  }

  return NextResponse.json({ success: true })
}