import { NextResponse } from 'next/server';
import { SendMailClient } from 'zeptomail';
import { registrationOTPEmail } from '@/lib/emails/registrationOTP';

export async function GET() {
  const testOTP = Math.floor(100000 + Math.random() * 900000).toString();

  const token = process.env.ZEPTO_PASS_REGISTRATION ?? '';

  if (!token) {
    return NextResponse.json({ success: false, error: 'Token missing in .env.local' }, { status: 500 });
  }

  const client = new SendMailClient({
    url: 'api.zeptomail.in/',
    token,
  });

  try {
    await client.sendMail({
      from: {
        address: process.env.ZEPTO_FROM_EMAIL ?? 'no-reply@orgzify.com',
        name: process.env.ZEPTO_FROM_NAME ?? 'Orgzify',
      },
      to: [{ email_address: { address: 'bills.sidney@gmail.com', name: 'Sidney' } }],
      subject: 'Your Orgzify Verification Code',
      htmlbody: registrationOTPEmail('Sidney', testOTP),
    });

    return NextResponse.json({ success: true, message: 'Email sent! Check your inbox.', otp: testOTP });

  } catch (err: unknown) {
    console.error('[ZeptoMail Full Error]', JSON.stringify(err, null, 2));
    return NextResponse.json({
      success: false,
      error: JSON.stringify(err),
    }, { status: 500 });
  }
}
