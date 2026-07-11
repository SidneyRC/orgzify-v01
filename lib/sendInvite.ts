// lib/sendInvite.ts
// Shared invite email utility — handles all invite types
// sendInvite → sends invite to recipient
// sendInviteNotification → sends accepted/declined/registered_only notification to original sender
// Server-side only — never import in client components

import { SendMailClient } from 'zeptomail';
import {
  inviteEmail,
  inviteAcceptedEmail,
  inviteDeclinedEmail,
  inviteRegisteredOnlyEmail,
  companyInviteEmail,
  companyDeactivatedEmail,
  companyReactivatedEmail,
  getSubjectLine,
  getNotificationSubject,
} from '@/lib/emails/inviteEmail';

export type InviteType = 'spouse' | 'profile_transfer' | 'profile_share' | 'company_admin_invite';

interface SendInviteOptions {
  to:               string;
  toName?:          string;
  fromName:         string;
  type:             InviteType;
  isRegistered:     boolean;
  acceptLink:       string;
  declineLink:      string;
  registerOnlyLink?: string;
}

export async function sendInvite({
  to, toName, fromName, type, isRegistered, acceptLink, declineLink, registerOnlyLink,
}: SendInviteOptions): Promise<boolean> {
  const passKey = process.env.ZEPTO_PASS_REFERRAL_LINK ?? '';
  if (!passKey) { console.error('[sendInvite] Missing ZEPTO_PASS_REFERRAL_LINK in .env.local'); return false; }
  const client = new SendMailClient({ url: 'https://api.zeptomail.in/v1.1/email', token: passKey });
  const html   = inviteEmail({ toName: toName || 'there', fromName, type, isRegistered, acceptLink, declineLink, registerOnlyLink });
  try {
    await client.sendMail({
      from:     { address: process.env.ZEPTO_FROM_EMAIL ?? 'no-reply@orgzify.com', name: process.env.ZEPTO_FROM_NAME ?? 'Orgzify' },
      to:       [{ email_address: { address: to, name: toName || to } }],
      subject:  getSubjectLine(type),
      htmlbody: html,
    });
    return true;
  } catch (err) { console.error('[sendInvite] Failed:', err); return false; }
}

interface SendInviteNotificationOptions {
  to:            string;
  toName:        string;
  recipientName: string;
  type:          InviteType;
  action:        'accepted' | 'declined' | 'registered_only';
}

export async function sendInviteNotification({
  to, toName, recipientName, type, action,
}: SendInviteNotificationOptions): Promise<boolean> {
  const passKey = process.env.ZEPTO_PASS_REFERRAL_LINK ?? '';
  if (!passKey) { console.error('[sendInviteNotification] Missing ZEPTO_PASS_REFERRAL_LINK in .env.local'); return false; }
  const client = new SendMailClient({ url: 'https://api.zeptomail.in/v1.1/email', token: passKey });

  let html: string;
  if (action === 'accepted')         html = inviteAcceptedEmail(toName, recipientName, type);
  else if (action === 'declined')    html = inviteDeclinedEmail(toName, recipientName, type);
  else                               html = inviteRegisteredOnlyEmail(toName, recipientName, type);

  try {
    await client.sendMail({
      from:     { address: process.env.ZEPTO_FROM_EMAIL ?? 'no-reply@orgzify.com', name: process.env.ZEPTO_FROM_NAME ?? 'Orgzify' },
      to:       [{ email_address: { address: to, name: toName } }],
      subject:  getNotificationSubject(type, action),
      htmlbody: html,
    });
    return true;
  } catch (err) { console.error('[sendInviteNotification] Failed:', err); return false; }
}

export async function sendCompanyInvite(options: {
  to: string; toName: string; companyName: string;
  dashboardLink: string; isRegistered: boolean; registerLink?: string;
}): Promise<boolean> {
  const passKey = process.env.ZEPTO_PASS_REFERRAL_LINK ?? '';
  if (!passKey) return false;
  const client = new SendMailClient({ url: 'https://api.zeptomail.in/v1.1/email', token: passKey });
  const html = companyInviteEmail(options.toName, options.companyName, options.dashboardLink, options.isRegistered, options.registerLink);
  try {
    await client.sendMail({
      from: { address: process.env.ZEPTO_FROM_EMAIL ?? 'no-reply@orgzify.com', name: process.env.ZEPTO_FROM_NAME ?? 'Orgzify' },
      to: [{ email_address: { address: options.to, name: options.toName } }],
      subject: 'You have been given admin access to a company on Orgzify',
      htmlbody: html,
    });
    return true;
  } catch (err) { console.error('[sendCompanyInvite] Failed:', err); return false; }
}

export async function sendCompanyDeactivated(options: {
  to: string; toName: string; companyName: string;
}): Promise<boolean> {
  const passKey = process.env.ZEPTO_PASS_REFERRAL_LINK ?? '';
  if (!passKey) return false;
  const client = new SendMailClient({ url: 'https://api.zeptomail.in/v1.1/email', token: passKey });
  const html = companyDeactivatedEmail(options.toName, options.companyName);
  try {
    await client.sendMail({
      from: { address: process.env.ZEPTO_FROM_EMAIL ?? 'no-reply@orgzify.com', name: process.env.ZEPTO_FROM_NAME ?? 'Orgzify' },
      to: [{ email_address: { address: options.to, name: options.toName } }],
      subject: `Your access to ${options.companyName} has been deactivated`,
      htmlbody: html,
    });
    return true;
  } catch (err) { console.error('[sendCompanyDeactivated] Failed:', err); return false; }
}

export async function sendCompanyReactivated(options: {
  to: string; toName: string; companyName: string; dashboardLink: string;
}): Promise<boolean> {
  const passKey = process.env.ZEPTO_PASS_REFERRAL_LINK ?? '';
  if (!passKey) return false;
  const client = new SendMailClient({ url: 'https://api.zeptomail.in/v1.1/email', token: passKey });
  const html = companyReactivatedEmail(options.toName, options.companyName, options.dashboardLink);
  try {
    await client.sendMail({
      from: { address: process.env.ZEPTO_FROM_EMAIL ?? 'no-reply@orgzify.com', name: process.env.ZEPTO_FROM_NAME ?? 'Orgzify' },
      to: [{ email_address: { address: options.to, name: options.toName } }],
      subject: `Your access to ${options.companyName} has been reactivated`,
      htmlbody: html,
    });
    return true;
  } catch (err) { console.error('[sendCompanyReactivated] Failed:', err); return false; }
}