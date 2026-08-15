// GOES IN: lib/helpDeskNotify.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendHelpDeskStatusEmail } from '@/lib/sendHelpDeskEmail'
import { getHelpDeskContactEmail } from '@/lib/helpDeskCountryContact'

export async function notifyTicketStatus(ticketId: string, message?: string, overrideStatusCode?: string): Promise<boolean> {
  const { data: ticket } = await supabaseAdmin.from('help_desk_tickets')
    .select('ticket_number, status_code, raised_for, reference_type, reporting_company_id').eq('id', ticketId).maybeSingle()
  if (!ticket) return false

  const { data: user } = await supabaseAdmin.from('users').select('email').eq('id', ticket.raised_for).maybeSingle()
  if (!user?.email) return false

  const statusCode = overrideStatusCode || ticket.status_code
  const { data: profile } = await supabaseAdmin.from('profiles').select('full_name').eq('user_id', ticket.raised_for).maybeSingle()
  const { data: statusRow } = await supabaseAdmin.from('help_desk_ticket_status_master').select('label').eq('code', statusCode).maybeSingle()
  const contactEmail = await getHelpDeskContactEmail(ticket.reference_type, ticket.reporting_company_id)

  return sendHelpDeskStatusEmail({
    to: user.email, name: profile?.full_name || 'there',
    ticketNumber: ticket.ticket_number, statusLabel: statusRow?.label || statusCode, message, fromEmail: contactEmail
  })
}
