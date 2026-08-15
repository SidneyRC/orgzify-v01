// GOES IN: app/(admin)/admin/ecosystem/helpdesk/api/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import { getHelpDeskAccess } from '@/lib/helpDeskAccess'
import { listHelpDeskTickets } from '@/lib/helpDeskTickets'
import { handleTicketAction } from '@/lib/helpDeskTicketActions'
import { notifyTicketStatus } from '@/lib/helpDeskNotify'
import { EMAIL_TRIGGER_STATUSES } from '@/lib/helpDeskStatusRules'

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const activeCompanyId = await getActiveCompanyId(req.cookies)
  const result = await handleTicketAction(session, activeCompanyId, body)
  if (result.error) return NextResponse.json({ error: result.error }, { status: result.status || 400 })
  return NextResponse.json({ success: true })
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')

  const activeCompanyId = await getActiveCompanyId(req.cookies)
  const access = await getHelpDeskAccess(session, activeCompanyId)

  const result = await listHelpDeskTickets(access, {
    page, limit,
    search: searchParams.get('search') || undefined,
    reference_type: searchParams.get('reference_type') || undefined,
    category_id: searchParams.get('category_id') || undefined,
    sub_category_id: searchParams.get('sub_category_id') || undefined,
    status_code: searchParams.get('status_code') || undefined,
    country_id: searchParams.get('country_id') || undefined,
    reporting_office_search: searchParams.get('reporting_office_search') || undefined,
  })

  return NextResponse.json(result)
}

async function nextTicketNumber(): Promise<string> {
  const { data } = await supabaseAdmin.from('help_desk_tickets')
    .select('ticket_number').order('created_at', { ascending: false }).limit(1)
  const last = data?.[0]?.ticket_number
  const nextNum = last ? parseInt(last.split('-')[1]) + 1 : 1
  return `SPTID-${String(nextNum).padStart(5, '0')}`
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const body = await req.json()
  const { reference_type, reference_id, category_id, sub_category_id, source, message, raised_for, status_code, next_followup_date } = body
  if (!reference_type || !category_id || !sub_category_id || !source) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }
  if (status_code === 'pending' && !next_followup_date) {
    return NextResponse.json({ error: 'Next Follow-up Date required for Pending' }, { status: 400 })
  }

  const activeCompanyId = await getActiveCompanyId(req.cookies)

  // Staff creating on someone else's behalf needs can_create. Customer/Entity self-raising does not.
  if (activeCompanyId) {
    const rights = await getFullCompanyRights(session.user_id, activeCompanyId)
    if (!rights['help_desk']?.can_create) return NextResponse.json({ error: 'Not authorised to create tickets' }, { status: 403 })
  }

  // Work out Reporting Company based on who the ticket is for
  let reportingCompanyId: string | null = null
  if (reference_type === 'entity' && reference_id) {
    const { data } = await supabaseAdmin.from('entities').select('reporting_company_id').eq('id', reference_id).maybeSingle()
    reportingCompanyId = data?.reporting_company_id || null
  } else if (reference_type === 'staff' && reference_id) {
    // Always the selected staff's own recruiting office — not whatever company was active when raised
    const { data } = await supabaseAdmin.from('admin_staff').select('recruiting_office_id').eq('id', reference_id).maybeSingle()
    reportingCompanyId = data?.recruiting_office_id || null
  } else if (reference_type === 'customer' && reference_id) {
    const { data } = await supabaseAdmin.from('profiles').select('reporting_company_id').eq('id', reference_id).maybeSingle()
    reportingCompanyId = data?.reporting_company_id || null
  }

  const ticket_number = await nextTicketNumber()
  const { data: ticket, error } = await supabaseAdmin.from('help_desk_tickets').insert({
    ticket_number, reference_type, reference_id: reference_id || null,
    raised_by: session.user_id, raised_for: raised_for || session.user_id,
    category_id, sub_category_id, reporting_company_id: reportingCompanyId,
    source, status_code: status_code || 'new', next_followup_date: next_followup_date || null, created_by: session.user_id
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  await supabaseAdmin.from('help_desk_ticket_activity').insert({
    ticket_id: ticket.id, activity_type: 'created', field_changed: 'status_code', old_value: null, new_value: 'new',
    visibility: 'internal', created_by: session.user_id
  })
  const logNewEmailFailure = () => supabaseAdmin.from('help_desk_ticket_activity').insert({
    ticket_id: ticket.id, activity_type: 'note', message: '⚠ Status email failed to send', visibility: 'internal', created_by: session.user_id
  }).then(r => { if (r.error) console.error('[emailFailureLog] insert failed:', r.error) })
  notifyTicketStatus(ticket.id, undefined, 'new').then(ok => { if (!ok) logNewEmailFailure() }).catch(err => { console.error('[notifyTicketStatus] threw:', err); logNewEmailFailure() })

  if (ticket.status_code !== 'new') {
    await supabaseAdmin.from('help_desk_ticket_activity').insert({
      ticket_id: ticket.id, activity_type: 'status_change', field_changed: 'status_code', old_value: 'new', new_value: ticket.status_code,
      visibility: 'internal', created_by: session.user_id
    })
    if (EMAIL_TRIGGER_STATUSES.includes(ticket.status_code)) {
      const logCreateEmailFailure = () => supabaseAdmin.from('help_desk_ticket_activity').insert({
        ticket_id: ticket.id, activity_type: 'note', message: '⚠ Status email failed to send', visibility: 'internal', created_by: session.user_id
      }).then(r => { if (r.error) console.error('[emailFailureLog] insert failed:', r.error) })
      notifyTicketStatus(ticket.id, undefined, ticket.status_code).then(ok => { if (!ok) logCreateEmailFailure() }).catch(err => { console.error('[notifyTicketStatus] threw:', err); logCreateEmailFailure() })
    }
  }

  if (message?.trim()) {
    await supabaseAdmin.from('help_desk_ticket_activity').insert({
      ticket_id: ticket.id, activity_type: 'note', message: message.trim(),
      visibility: 'external', created_by: session.user_id
    })
  }

  return NextResponse.json({ data: ticket })
}
