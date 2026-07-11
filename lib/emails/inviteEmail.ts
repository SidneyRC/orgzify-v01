// lib/emails/inviteEmail.ts
// Generic invite email template — handles all invite types
// Two versions: registered (Accept/Decline) and unregistered (Accept & Register / Register Only)
// Also includes sender notification emails: inviteAcceptedEmail + inviteDeclinedEmail + inviteRegisteredOnlyEmail
// Server-side only — never import in client components

type InviteEmailType = 'spouse' | 'profile_transfer' | 'profile_share' | 'company_admin_invite';

interface InviteEmailOptions {
  toName:            string;
  fromName:          string;
  type:              InviteEmailType;
  isRegistered:      boolean;
  acceptLink:        string;
  declineLink:       string;
  registerOnlyLink?: string;
}

function getTypeLabel(type: InviteEmailType): string {
  switch (type) {
    case 'spouse':           return 'connect as their spouse';
    case 'profile_transfer': return 'transfer a profile to you';
    case 'profile_share':    return 'share a profile with you';
    case 'company_admin_invite': return 'give you admin access to their company';
  }
}

function getSubjectLine(type: InviteEmailType): string {
  switch (type) {
    case 'spouse':           return 'You have been invited to connect as a spouse on Orgzify';
    case 'profile_transfer': return 'You have a profile transfer request on Orgzify';
    case 'profile_share':    return 'Someone has shared a profile with you on Orgzify';
    case 'company_admin_invite': return 'You have been given admin access to a company on Orgzify';
  }
}

function getNotificationSubject(type: InviteEmailType, action: 'accepted' | 'declined' | 'registered_only'): string {
  if (action === 'registered_only') {
    return type === 'spouse'
      ? 'Your spouse invite contact has registered on Orgzify'
      : 'Your invited contact has registered on Orgzify';
  }
  if (type === 'spouse') {
    return action === 'accepted'
      ? 'Your spouse invite was Accepted on Orgzify'
      : 'Your spouse invite was Declined on Orgzify';
  }
  if (type === 'profile_transfer') {
    return action === 'accepted'
      ? 'Your profile transfer was Accepted on Orgzify'
      : 'Your profile transfer was Declined on Orgzify';
  }
  return action === 'accepted' ? 'Your invite was Accepted' : 'Your invite was Declined';
}

export { getSubjectLine, getNotificationSubject };

// Notification — recipient accepted
export function inviteAcceptedEmail(toName: string, recipientName: string, type: InviteEmailType): string {
  const typeLabel = type === 'spouse' ? 'spouse connection' : type === 'profile_share' ? 'profile share' : 'profile transfer';
  return `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f2557;padding:28px 40px;text-align:center;">
          <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">ORGZIFY</span>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="font-size:16px;color:#1a1a2e;margin:0 0 16px;">Hi ${toName},</p>
          <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 24px;">
            Great news! <strong>${recipientName}</strong> has <strong style="color:#16a34a;">accepted</strong>
            your ${typeLabel} invite on <strong>Orgzify</strong>.
          </p>
          <p style="font-size:14px;color:#666;margin:0 0 32px;">
            Both profiles are now linked. You can view your connected profile on your profile page.
          </p>
          <p style="font-size:12px;color:#999;margin:32px 0 0;text-align:center;">This is an automated notification from Orgzify.</p>
        </td></tr>
        <tr><td style="background:#f4f4f5;padding:20px;text-align:center;">
          <p style="font-size:11px;color:#aaa;margin:0;">Powered by ORGZIFY &copy; 2026 All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Notification — recipient declined
export function inviteDeclinedEmail(toName: string, recipientName: string, type: InviteEmailType): string {
  const typeLabel = type === 'spouse' ? 'spouse connection' : type === 'profile_share' ? 'profile share' : 'profile transfer';
  return `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f2557;padding:28px 40px;text-align:center;">
          <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">ORGZIFY</span>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="font-size:16px;color:#1a1a2e;margin:0 0 16px;">Hi ${toName},</p>
          <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 24px;">
            <strong>${recipientName}</strong> has <strong style="color:#dc2626;">declined</strong>
            your ${typeLabel} invite on <strong>Orgzify</strong>.
          </p>
          <p style="font-size:14px;color:#666;margin:0 0 32px;">
            No changes have been made to your profile. You can send a new invite if needed.
          </p>
          <p style="font-size:12px;color:#999;margin:32px 0 0;text-align:center;">This is an automated notification from Orgzify.</p>
        </td></tr>
        <tr><td style="background:#f4f4f5;padding:20px;text-align:center;">
          <p style="font-size:11px;color:#aaa;margin:0;">Powered by ORGZIFY &copy; 2026 All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// Notification — recipient registered only (no linking)
export function inviteRegisteredOnlyEmail(toName: string, recipientName: string, type: InviteEmailType): string {
  const typeLabel = type === 'spouse' ? 'spouse connection' : type === 'profile_share' ? 'profile share' : 'profile transfer';
  return `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f2557;padding:28px 40px;text-align:center;">
          <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">ORGZIFY</span>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="font-size:16px;color:#1a1a2e;margin:0 0 16px;">Hi ${toName},</p>
          <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 24px;">
            <strong>${recipientName}</strong> has registered on <strong>Orgzify</strong> via your ${typeLabel} invite,
            but chose <strong style="color:#d97706;">not to link</strong> their profile at this time.
          </p>
          <p style="font-size:14px;color:#666;margin:0 0 32px;">
            No profile changes have been made. You can send a new invite if you'd like to connect again.
          </p>
          <p style="font-size:12px;color:#999;margin:32px 0 0;text-align:center;">This is an automated notification from Orgzify.</p>
        </td></tr>
        <tr><td style="background:#f4f4f5;padding:20px;text-align:center;">
          <p style="font-size:11px;color:#aaa;margin:0;">Powered by ORGZIFY &copy; 2026 All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function companyInviteEmail(toName: string, companyName: string, dashboardLink: string, isRegistered: boolean, registerLink?: string): string {
  const actionButton = isRegistered
    ? `<a href="${dashboardLink}" style="display:inline-block;background:#1D3A8A;color:#ffffff;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:8px;text-decoration:none;width:220px;text-align:center;">View Dashboard</a>`
    : `<a href="${registerLink}" style="display:inline-block;background:#1D3A8A;color:#ffffff;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:8px;text-decoration:none;width:220px;text-align:center;">Register & Get Started</a>`;
  return `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f2557;padding:28px 40px;text-align:center;">
          <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">ORGZIFY</span>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="font-size:16px;color:#1a1a2e;margin:0 0 16px;">Hi ${toName},</p>
          <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 24px;">
            You have been given <strong>admin access</strong> to <strong>${companyName}</strong> on Orgzify.
          </p>
          <p style="font-size:14px;color:#666;margin:0 0 32px;">
            ${isRegistered ? 'Click below to go to your company dashboard.' : 'Please register to get started and access your company dashboard.'}
          </p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center">${actionButton}</td></tr>
          </table>
          <p style="font-size:12px;color:#999;margin:32px 0 0;text-align:center;">If you did not expect this, please contact support@orgzify.com</p>
        </td></tr>
        <tr><td style="background:#f4f4f5;padding:20px;text-align:center;">
          <p style="font-size:11px;color:#aaa;margin:0;">Powered by ORGZIFY &copy; 2026 All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function companyDeactivatedEmail(toName: string, companyName: string): string {
  return `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f2557;padding:28px 40px;text-align:center;">
          <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">ORGZIFY</span>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="font-size:16px;color:#1a1a2e;margin:0 0 16px;">Hi ${toName},</p>
          <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 24px;">
            Your access to <strong>${companyName}</strong> on Orgzify has been <strong style="color:#dc2626;">deactivated</strong>.
          </p>
          <p style="font-size:14px;color:#666;margin:0 0 32px;">
            Your account access has been suspended. Please contact your administrator if you believe this is an error.
          </p>
          <p style="font-size:12px;color:#999;margin:32px 0 0;text-align:center;">This is an automated notification from Orgzify.</p>
        </td></tr>
        <tr><td style="background:#f4f4f5;padding:20px;text-align:center;">
          <p style="font-size:11px;color:#aaa;margin:0;">Powered by ORGZIFY &copy; 2026 All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function companyReactivatedEmail(toName: string, companyName: string, dashboardLink: string): string {
  return `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f2557;padding:28px 40px;text-align:center;">
          <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">ORGZIFY</span>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="font-size:16px;color:#1a1a2e;margin:0 0 16px;">Hi ${toName},</p>
          <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 24px;">
            Your access to <strong>${companyName}</strong> on Orgzify has been <strong style="color:#16a34a;">reactivated</strong>.
          </p>
          <p style="font-size:14px;color:#666;margin:0 0 32px;">You can now log in and access your company dashboard.</p>
          <table cellpadding="0" cellspacing="0" width="100%">
            <tr><td align="center">
              <a href="${dashboardLink}" style="display:inline-block;background:#1D3A8A;color:#ffffff;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:8px;text-decoration:none;width:220px;text-align:center;">View Dashboard</a>
            </td></tr>
          </table>
          <p style="font-size:12px;color:#999;margin:32px 0 0;text-align:center;">This is an automated notification from Orgzify.</p>
        </td></tr>
        <tr><td style="background:#f4f4f5;padding:20px;text-align:center;">
          <p style="font-size:11px;color:#aaa;margin:0;">Powered by ORGZIFY &copy; 2026 All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function inviteEmail({
  toName, fromName, type, isRegistered, acceptLink, declineLink, registerOnlyLink,
}: InviteEmailOptions): string {
  const typeLabel = getTypeLabel(type);

  const registeredButtons = `
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center" style="padding-bottom:12px;">
        <a href="${acceptLink}" style="display:inline-block;background:#1D3A8A;color:#ffffff;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:8px;text-decoration:none;width:220px;text-align:center;">
          ✅ Accept
        </a>
      </td></tr>
      <tr><td align="center">
        <a href="${declineLink}" style="display:inline-block;background:#ffffff;color:#6b7280;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:8px;text-decoration:none;border:1px solid #e5e7eb;width:220px;text-align:center;">
          ❌ Decline
        </a>
      </td></tr>
    </table>`;

const unregisteredButtons = `
    <table cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center">
        <a href="${acceptLink}" style="display:inline-block;background:#1D3A8A;color:#ffffff;font-size:15px;font-weight:bold;padding:14px 36px;border-radius:8px;text-decoration:none;width:220px;text-align:center;">
          ✅ Accept Invite
        </a>
      </td></tr>
    </table>`;

  return `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f4f4f5;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f5;padding:40px 0;">
    <tr><td align="center">
      <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f2557;padding:28px 40px;text-align:center;">
          <span style="color:#ffffff;font-size:22px;font-weight:bold;letter-spacing:1px;">ORGZIFY</span>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="font-size:16px;color:#1a1a2e;margin:0 0 16px;">Hi ${toName},</p>
          <p style="font-size:15px;color:#444;line-height:1.6;margin:0 0 24px;">
            <strong>${fromName}</strong> has invited you to ${typeLabel} on
            <strong>Orgzify</strong> — a platform to manage events, activities, and more for your family.
          </p>
          <p style="font-size:14px;color:#666;margin:0 0 32px;">
            ${isRegistered
              ? 'Please choose to accept or decline the invitation below.'
              : 'Choose to register and share, or register without accepting. This link is valid for <strong>7 days</strong>.'}
          </p>
          ${isRegistered ? registeredButtons : unregisteredButtons}
          <p style="font-size:12px;color:#999;margin:32px 0 0;text-align:center;">
            If you did not expect this email, you can safely ignore it.
          </p>
        </td></tr>
        <tr><td style="background:#f4f4f5;padding:20px;text-align:center;">
          <p style="font-size:11px;color:#aaa;margin:0;">Powered by ORGZIFY &copy; 2026 All rights reserved.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}
