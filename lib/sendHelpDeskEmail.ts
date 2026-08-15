// GOES IN: lib/sendHelpDeskEmail.ts
import { SendMailClient } from 'zeptomail'
import { entityStatusEmail } from '@/lib/emails/entityStatusEmail'

type Options = { to: string; name: string; ticketNumber: string; statusLabel: string; message?: string; fromEmail?: string }

export async function sendHelpDeskStatusEmail({ to, name, ticketNumber, statusLabel, message, fromEmail }: Options): Promise<boolean> {
  const passKey = process.env.ZEPTO_PASS_HELPDESK ?? ''
  if (!passKey) { console.error('[sendHelpDeskStatusEmail] Missing ZEPTO_PASS_HELPDESK token'); return false }
  const verifiedSender = process.env.ZEPTO_FROM_EMAIL_HELPDESK ?? 'support.donotreply@orgzify.com'
  const contactEmail = fromEmail || verifiedSender

  const html = entityStatusEmail(name, {
    heading: `Ticket ${ticketNumber} — ${statusLabel}`,
    message: `Your Help Desk ticket <strong>${ticketNumber}</strong> has been updated to <strong>${statusLabel}</strong>.`,
    reason: message,
    supportEmail: contactEmail,
  })

  const client = new SendMailClient({ url: 'https://api.zeptomail.in/v1.1/email', token: passKey })
  try {
    await client.sendMail({
      from: { address: verifiedSender, name: 'Orgzify Support' },
      to: [{ email_address: { address: to, name } }],
      reply_to: [{ address: contactEmail, name: 'Orgzify Support' }],
      subject: `Ticket ${ticketNumber} — ${statusLabel}`,
      htmlbody: html,
    })
    return true
  } catch (err) {
    console.error('[sendHelpDeskStatusEmail] Failed:', err)
    return false
  }
}
