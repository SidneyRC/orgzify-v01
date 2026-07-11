import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();

    if (!email) {
      return NextResponse.json({ success: false, error: 'Email is required.' }, { status: 400 });
    }

    // Check email exists
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id, account_status, is_email_verified')
      .eq('email', email.toLowerCase().trim())
      .maybeSingle();

    if (!existingUser) {
      return NextResponse.json({ success: false, error: 'No account found with this email address.' }, { status: 404 });
    }

    if (existingUser.account_status !== 'active') {
      return NextResponse.json({ success: false, error: 'Your account has been suspended. Please contact support.' }, { status: 403 });
    }

    if (!existingUser.is_email_verified) {
      return NextResponse.json({ success: false, error: 'Please verify your email before signing in.' }, { status: 403 });
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';

    // Save OTP to otp_logs
    const { error: dbError } = await supabaseAdmin.from('otp_logs').insert({
      email: email.toLowerCase().trim(),
      otp_code: otp,
      purpose: 'otp-login',
      is_used: false,
      expires_at: expiresAt,
      ip_address: ip,
    });

    if (dbError) {
      console.error('[login-otp/send] Supabase error:', dbError);
      return NextResponse.json({ success: false, error: 'Failed to save OTP.' }, { status: 500 });
    }

    // Send email
    const emailSent = await sendEmail({ to: email.toLowerCase().trim(), name: '', otp, purpose: 'otp-login' });

    if (!emailSent) {
      return NextResponse.json({ success: false, error: 'Failed to send OTP email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });

  } catch (err) {
    console.error('[login-otp/send] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
