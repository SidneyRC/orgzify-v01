import { SendMailClient } from 'zeptomail';
import { registrationOTPEmail } from '@/lib/emails/registrationOTP';

type EmailPurpose =
  | 'registration'
  | 'email-change'
  | 'password-reset'
  | 'otp-login'
  | 'booking'
  | 'cancellation'
  | 'reschedule';

interface SendEmailOptions {
  to: string;
  name: string;
  otp: string;
  purpose: EmailPurpose;
}

const AGENT_CONFIG: Record<EmailPurpose, { subject: string; passKey: string }> = {
  'registration': { subject: 'Your Orgzify Verification Code', passKey: process.env.ZEPTO_PASS_REGISTRATION ?? '' },
  'email-change': { subject: 'Update Your Orgzify Email Address', passKey: process.env.ZEPTO_PASS_REGISTRATION ?? '' },
  'password-reset': { subject: 'Reset Your Orgzify Password', passKey: process.env.ZEPTO_PASS_PASSWORD_RESET ?? '' },
  'otp-login': { subject: 'Your Orgzify Login Code', passKey: process.env.ZEPTO_PASS_REGISTRATION ?? '' },
  'booking': { subject: 'Your Booking Confirmation', passKey: process.env.ZEPTO_PASS_BOOKING ?? '' },
  'cancellation': { subject: 'Your Booking Cancellation', passKey: process.env.ZEPTO_PASS_CANCELLATION ?? '' },
  'reschedule': { subject: 'Your Booking Rescheduled', passKey: process.env.ZEPTO_PASS_RESCHEDULE ?? '' },
};

function getEmailHTML(purpose: EmailPurpose, name: string, otp: string): string {
  switch (purpose) {
    case 'email-change':
      return registrationOTPEmail(name, otp, "You're almost there! Use your verification code below to update your Email on Orgzify.");
    case 'otp-login':
      return registrationOTPEmail(name, otp, "Use the code below to sign in to your Orgzify account.");
    case 'password-reset':
      return registrationOTPEmail(name, otp, "Use the code below to reset your Orgzify password.");
    default:
      return registrationOTPEmail(name, otp);
  }
}

export async function sendEmail({ to, name, otp, purpose }: SendEmailOptions): Promise<boolean> {
  const config = AGENT_CONFIG[purpose];
  if (!config.passKey) {
    console.error(`[sendEmail] Missing ZeptoMail token for: ${purpose}`);
    return false;
  }
  const client = new SendMailClient({
    url: 'https://api.zeptomail.in/v1.1/email',
    token: config.passKey,
  });
  try {
    await client.sendMail({
      from: {
        address: process.env.ZEPTO_FROM_EMAIL ?? 'no-reply@orgzify.com',
        name: process.env.ZEPTO_FROM_NAME ?? 'Orgzify',
      },
      to: [{ email_address: { address: to, name } }],
      subject: config.subject,
      htmlbody: getEmailHTML(purpose, name, otp),
    });
    return true;
  } catch (err) {
    console.error('[sendEmail] Failed:', err);
    return false;
  }
}