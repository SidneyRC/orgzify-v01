import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(req: NextRequest) {
  try {
    const { name, email, purpose = 'registration' } = await req.json();

    if (!name || !email) {
      return NextResponse.json({ success: false, error: 'Name and email are required.' }, { status: 400 });
    }

    const cleanEmail = email.toLowerCase().trim();

    // ── Purpose-based email existence check ────────────────────────────────
    const { data: existingUser } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', cleanEmail)
      .maybeSingle();

    if (purpose === 'registration' && existingUser) {
      return NextResponse.json({ success: false, error: 'This email is already registered. Please sign in instead.' }, { status: 409 });
    }

    if ((purpose === 'forgot-password' || purpose === 'account-locked') && !existingUser) {
      return NextResponse.json({ success: false, error: 'No account found with this email address.' }, { status: 404 });
    }

    // ── Mark all previous unused OTPs for same email + purpose as used ─────
    await supabaseAdmin
      .from('otp_logs')
      .update({ is_used: true })
      .eq('email', cleanEmail)
      .eq('purpose', purpose)
      .eq('is_used', false);

    // ── Generate new OTP ───────────────────────────────────────────────────
    const otp       = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const ip        = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown';

    // ── Save OTP to otp_logs ───────────────────────────────────────────────
    const { error: dbError } = await supabaseAdmin.from('otp_logs').insert({
      email:      cleanEmail,
      otp_code:   otp,
      purpose,
      is_used:    false,
      expires_at: expiresAt,
      ip_address: ip,
    });

    if (dbError) {
      console.error('[send-otp] Supabase error:', dbError);
      return NextResponse.json({ success: false, error: 'Failed to save OTP.' }, { status: 500 });
    }

    // ── Send email ─────────────────────────────────────────────────────────
    const emailSent = await sendEmail({ to: cleanEmail, name, otp, purpose });
    if (!emailSent) {
      return NextResponse.json({ success: false, error: 'Failed to send OTP email.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: 'OTP sent successfully.' });

  } catch (err) {
    console.error('[send-otp] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
