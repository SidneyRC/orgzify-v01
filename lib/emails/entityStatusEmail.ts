// THIS FILE GOES IN: lib/emails/entityStatusEmail.ts (NEW FILE)
export function entityStatusEmail(name: string, opts: {
  heading: string; message: string; reason?: string; buttonLabel?: string; buttonUrl?: string; supportEmail?: string;
}): string {
  const { heading, message, reason, buttonLabel, buttonUrl, supportEmail } = opts;
  const contactEmail = supportEmail || 'support@orgzify.com';
  return `
<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /></head>
<body style="margin:0;padding:0;background-color:#f4f4f7;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;padding:32px 0;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e5e5e5;">
        <tr>
          <td style="background:linear-gradient(135deg,#7F77DD 0%,#534AB7 100%);padding:24px 32px;">
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="background:rgba(255,255,255,0.2);border-radius:8px;width:32px;height:32px;text-align:center;vertical-align:middle;">
                  <span style="color:#ffffff;font-weight:bold;font-size:14px;">O</span>
                </td>
                <td style="padding-left:10px;">
                  <span style="color:#ffffff;font-weight:bold;font-size:18px;letter-spacing:1px;">ORGZIFY</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:32px 32px 8px;">
            <p style="font-size:22px;font-weight:bold;color:#1a1a1a;margin:0 0 8px;">${heading}</p>
            <p style="font-size:14px;color:#666666;line-height:1.7;margin:0;">Hi ${name},<br/><br/>${message}</p>
          </td>
        </tr>
        ${reason ? `
        <tr>
          <td style="padding:16px 32px 0;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAEEDA;border-radius:8px;border-left:3px solid #BA7517;">
              <tr><td style="padding:14px 16px;">
                <p style="font-size:12px;color:#854F0B;margin:0 0 4px;font-weight:bold;">DETAILS</p>
                <p style="font-size:13px;color:#854F0B;margin:0;">${reason}</p>
              </td></tr>
            </table>
          </td>
        </tr>` : ''}
        ${buttonLabel && buttonUrl ? `
        <tr>
          <td style="padding:24px 32px;text-align:center;">
            <a href="${buttonUrl}" style="background:#534AB7;color:#ffffff;text-decoration:none;font-size:14px;font-weight:bold;padding:12px 28px;border-radius:8px;display:inline-block;">${buttonLabel}</a>
          </td>
        </tr>` : `<tr><td style="padding-bottom:16px;"></td></tr>`}
        <tr>
          <td style="padding:0 32px 24px;">
            <p style="font-size:13px;color:#999999;line-height:1.7;margin:0;">
              Questions? Contact us at
              <a href="mailto:${contactEmail}" style="color:#7F77DD;text-decoration:none;">${contactEmail}</a>
            </p>
          </td>
        </tr>
        <tr>
          <td style="border-top:1px solid #eeeeee;padding:20px 32px;text-align:center;">
            <p style="font-size:11px;color:#aaaaaa;margin:0;">
              Powered by <a href="https://orgzify.com" style="color:#7F77DD;text-decoration:none;font-weight:bold;">ORGZIFY</a> &copy; 2026 All rights reserved.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
