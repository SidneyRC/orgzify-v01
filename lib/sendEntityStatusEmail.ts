// THIS FILE GOES IN: lib/sendEntityStatusEmail.ts (NEW FILE)
import { SendMailClient } from 'zeptomail'
import { entityStatusEmail } from '@/lib/emails/entityStatusEmail'

export type EntityEmailType = 'received' | 'approved' | 'rejected' | 'correction' | 'suspended' | 'blocked' | 'reactivated' | 'complete_registration'

const SUBJECTS: Record<EntityEmailType, string> = {
  received: "We've Received Your Registration - Orgzify",
  approved: 'Your Business Profile is Approved! - Orgzify',
  rejected: 'Update on Your Registration - Orgzify',
  correction: 'Action Needed on Your Registration - Orgzify',
  suspended: 'Your Account Has Been Suspended - Orgzify',
  blocked: 'Your Account Has Been Blocked - Orgzify',
  reactivated: 'Your Account Has Been Reactivated - Orgzify',
  complete_registration: 'Action Needed - Complete Your Registration - Orgzify',
}

const CONTENT: Record<EntityEmailType, { heading: string; message: string }> = {
  received: { heading: "We've received your request!", message: "thanks for submitting your registration. Our team will review it within 24–48 hours." },
  approved: { heading: 'You’re approved! 🎉', message: 'your Business Profile is now active on Orgzify.' },
  rejected: { heading: 'Registration Update', message: "after review, we're unable to approve your registration at this time." },
  correction: { heading: 'Action Needed', message: 'we need a small correction before we can proceed with your registration.' },
  suspended: { heading: 'Your account has been suspended', message: 'your Business Profile has been temporarily suspended.' },
  blocked: { heading: 'Your account has been blocked', message: 'your Business Profile has been blocked.' },
  reactivated: { heading: 'Your account has been reactivated', message: 'your Business Profile is active again on Orgzify.' },
  complete_registration: { heading: 'Please complete your registration', message: 'we were unable to auto-match your Reporting Office. Please continue your registration to finish setup.' },
}

export async function sendEntityStatusEmail({ to, name, type, reason, buttonLabel, buttonUrl, supportEmail }: {
  to: string; name: string; type: EntityEmailType; reason?: string; buttonLabel?: string; buttonUrl?: string; supportEmail?: string
}): Promise<boolean> {
  const token = process.env.ZEPTO_PASS_REGISTRATION ?? ''
  if (!token) { console.error('[sendEntityStatusEmail] Missing ZEPTO_PASS_REGISTRATION'); return false }

  const client = new SendMailClient({ url: 'https://api.zeptomail.in/v1.1/email', token })
  const { heading, message } = CONTENT[type]

  try {
    await client.sendMail({
      from: { address: process.env.ZEPTO_FROM_EMAIL ?? 'no-reply@orgzify.com', name: process.env.ZEPTO_FROM_NAME ?? 'Orgzify' },
      to: [{ email_address: { address: to, name } }],
      subject: SUBJECTS[type],
      htmlbody: entityStatusEmail(name, { heading, message, reason, buttonLabel, buttonUrl, supportEmail }),
    })
    return true
  } catch (err) {
    console.error('[sendEntityStatusEmail] Failed:', err)
    return false
  }
}
