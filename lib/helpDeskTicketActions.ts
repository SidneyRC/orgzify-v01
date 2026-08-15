// GOES IN: lib/helpDeskTicketActions.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import { getHelpDeskAccess, isPairAllowed } from '@/lib/helpDeskAccess'
import { notifyTicketStatus } from '@/lib/helpDeskNotify'
import { isValidTransition, EMAIL_TRIGGER_STATUSES } from '@/lib/helpDeskStatusRules'

type Result = { success?: boolean; error?: string; status?: number }

export async function handleTicketAction(session: any, activeCompanyId: string | null, body: any): Promise<Result> {
  const { ticket_id, action } = body
  if (!ticket_id || !action) return { error: 'Missing ticket_id or action', status: 400 }

  const { data: ticket } = await supabaseAdmin.from('help_desk_tickets')
    .select('id, sub_category_id, status_code').eq('id', ticket_id).maybeSingle()
  if (!ticket) return { error: 'Ticket not found', status: 404 }

  const access = await getHelpDeskAccess(session, activeCompanyId)
  if (!isPairAllowed(access, ticket.sub_category_id, ticket.status_code)) {
    return { error: 'Not authorised for this ticket', status: 403 }
  }

  if (action === 'change_status') {
    const { new_status, next_followup_date } = body
    if (!isValidTransition(ticket.status_code, new_status)) return { error: `Cannot move from ${ticket.status_code} to ${new_status}`, status: 400 }
    if (new_status === 'pending' && !next_followup_date) return { error: 'Next Follow-up Date required', status: 400 }
    const patch: any = { status_code: new_status, updated_at: new Date().toISOString() }
    if (next_followup_date) patch.next_followup_date = next_followup_date
    if (new_status === 'closed') patch.closed_at = new Date().toISOString()
    await supabaseAdmin.from('help_desk_tickets').update(patch).eq('id', ticket_id)
    await supabaseAdmin.from('help_desk_ticket_activity').insert({
      ticket_id, activity_type: 'status_change', field_changed: 'status_code',
      old_value: ticket.status_code, new_value: new_status, visibility: 'internal', created_by: session.user_id
    })
    if (EMAIL_TRIGGER_STATUSES.includes(new_status)) {
      const logFailure = () => supabaseAdmin.from('help_desk_ticket_activity').insert({
        ticket_id, activity_type: 'note', message: '⚠ Status email failed to send', visibility: 'internal', created_by: session.user_id
      }).then(r => { if (r.error) console.error('[emailFailureLog] insert failed:', r.error) })
      notifyTicketStatus(ticket_id, body.message).then(ok => { if (!ok) logFailure() }).catch(err => { console.error('[notifyTicketStatus] threw:', err); logFailure() })
    }
    return { success: true }
  }

  if (action === 'resend_email') {
    const ok = await notifyTicketStatus(ticket_id, undefined, body.resend_status_code)
    const message = ok ? `Status email resent (${body.resend_status_code || 'current status'})` : '⚠ Resend attempt failed — status email did not send'
    const res = await supabaseAdmin.from('help_desk_ticket_activity').insert({
      ticket_id, activity_type: 'email_resent', message, visibility: 'internal', created_by: session.user_id
    })
    if (res.error) console.error('[emailFailureLog] insert failed:', res.error)
    return { success: true }
  }

  if (action === 'add_note') {
    const { message, visibility } = body
    if (!message?.trim()) return { error: 'Message required', status: 400 }
    await supabaseAdmin.from('help_desk_ticket_activity').insert({
      ticket_id, activity_type: 'note', message: message.trim(),
      visibility: visibility || 'external', created_by: session.user_id
    })
    return { success: true }
  }

  if (action === 'edit_note') {
    if (activeCompanyId && !session.is_super_admin) {
      const rights = await getFullCompanyRights(session.user_id, activeCompanyId)
      if (!rights['help_desk']?.can_overwrite_edit) return { error: 'Not authorised', status: 403 }
    }
    const { activity_id, new_message } = body
    if (!activity_id || !new_message) return { error: 'Missing fields', status: 400 }
    const { data: existing } = await supabaseAdmin.from('help_desk_ticket_activity')
      .select('message, is_edited, original_message').eq('id', activity_id).maybeSingle()
    if (!existing) return { error: 'Note not found', status: 404 }
    await supabaseAdmin.from('help_desk_ticket_activity').update({
      message: new_message, is_edited: true,
      original_message: existing.is_edited ? existing.original_message : existing.message
    }).eq('id', activity_id)
    return { success: true }
  }

  return { error: 'Unknown action', status: 400 }
}
