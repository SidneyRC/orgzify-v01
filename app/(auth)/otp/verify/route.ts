import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { email, otp, purpose = 'registration' } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP are required.' }, { status: 400 });
    }

    // ── Find matching valid OTP ────────────────────────────────────────────
    const { data, error } = await supabaseAdmin
      .from('otp_logs')
      .select('id, expires_at, is_used')
      .eq('email', email.toLowerCase().trim())
      .eq('otp_code', otp)
      .eq('purpose', purpose)
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ success: false, error: 'Invalid OTP.' }, { status: 400 });
    }

    // ── Check expiry ───────────────────────────────────────────────────────
    if (new Date(data.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'OTP has expired. Please resend.' }, { status: 400 });
    }

    // ── Mark OTP as used ──────────────────────────────────────────────────
    await supabaseAdmin.from('otp_logs').update({ is_used: true }).eq('id', data.id);

    return NextResponse.json({ success: true, message: 'OTP verified successfully.' });

  } catch (err) {
    console.error('[verify-otp] Error:', err);
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
