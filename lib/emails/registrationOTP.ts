export function registrationOTPEmail(name: string, otp: string, message?: string): string {
  const bodyText = message ?? "You're almost there! Use your verification code below to complete your registration on Orgzify.";
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
            <p style="font-size:24px;font-weight:bold;color:#1a1a1a;margin:0 0 8px;">Hi ${name},</p>
            <p style="font-size:14px;color:#666666;line-height:1.7;margin:0;">${bodyText}</p>
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f7;border-radius:12px;border:1px solid #e5e5e5;">
              <tr><td style="padding:24px;text-align:center;">
                <p style="font-size:11px;color:#999999;letter-spacing:1px;margin:0 0 16px;">ONE-TIME PASSWORD</p>
                <table cellpadding="0" cellspacing="0" style="margin:0 auto 16px;">
                  <tr>
                    ${otp.split('').map(digit => `
                    <td style="width:40px;height:48px;background:#ffffff;border:1px solid #dddddd;border-radius:8px;text-align:center;vertical-align:middle;font-size:22px;font-weight:bold;color:#7F77DD;padding:0 6px;">${digit}</td>
                    <td style="width:8px;"></td>`).join('')}
                  </tr>
                </table>
                <p style="font-size:12px;color:#999999;margin:0;">&#128337; Expires in <strong style="color:#333333;">10 minutes</strong></p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#FAEEDA;border-radius:8px;border-left:3px solid #BA7517;">
              <tr><td style="padding:12px 16px;">
                <p style="font-size:12px;color:#854F0B;margin:0;">
                  &#128274; Never share this code with anyone. Orgzify will never ask for it.
                </p>
              </td></tr>
            </table>
          </td>
        </tr>
        <tr>
          <td style="padding:0 32px 24px;">
            <p style="font-size:13px;color:#999999;line-height:1.7;margin:0;">
              Didn't request this? You can safely ignore this email. If you're concerned, contact us at
              <a href="mailto:support@orgzify.com" style="color:#7F77DD;text-decoration:none;">support@orgzify.com</a>
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
