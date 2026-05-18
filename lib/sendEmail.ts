import { SendMailClient } from 'zeptomail';
import { registrationOTPEmail } from '@/lib/emails/registrationOTP';

type EmailPurpose =
  | 'registration'
  | 'password-reset'
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
  'registration': {
    subject: 'Your Orgzify Verification Code',
    passKey: process.env.ZEPTO_PASS_REGISTRATION ?? '',
  },
  'password-reset': {
    subject: 'Reset Your Orgzify Password',
    passKey: process.env.ZEPTO_PASS_PASSWORD_RESET ?? '',
  },
  'booking': {
    subject: 'Your Booking Confirmation',
    passKey: process.env.ZEPTO_PASS_BOOKING ?? '',
  },
  'cancellation': {
    subject: 'Your Booking Cancellation',
    passKey: process.env.ZEPTO_PASS_CANCELLATION ?? '',
  },
  'reschedule': {
    subject: 'Your Booking Rescheduled',
    passKey: process.env.ZEPTO_PASS_RESCHEDULE ?? '',
  },
};

function getEmailHTML(purpose: EmailPurpose, name: string, otp: string): string {
  switch (purpose) {
    case 'registration':
      return registrationOTPEmail(name, otp);
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
