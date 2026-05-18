import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(req: NextRequest) {
  try {
    const { name, email } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email are required.' }, { status: 400 });
    }

    // Generate 6 digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    // OTP expires in 10 minutes
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Get IP address
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';

    // Save OTP to Supabase
    const { error: dbError } = await supabase.from('otp_logs').insert({
      email,
      otp_code: otp,
      purpose: 'registration',
      is_used: false,
      expires_at: expiresAt,
      ip_address: ip,
    });

    if (dbError) {
      console.error('[send-otp] Supabase error:', dbError);
      return NextResponse.json({ success: false, error: 'Failed to save OTP.' }, { status: 500 });
    }

    // Send email via ZeptoMail
    const emailSent = await sendEmail({ to: email, name, otp, purpose: 'registration' });

    if (!emailSent) {
      return NextResponse.json({ success: false, error: 'Failed to send OTP email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });

  } catch (err) {
    console.error('[send-otp] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
