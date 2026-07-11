// OREV1-034 — Email Change: Verify OTP + Update Email
// Route: POST /profile/email/verify
// Verifies OTP → updates email in users table → marks OTP as used

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export async function POST(req: NextRequest) {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  const { otp } = await req.json();

  if (!otp?.trim())
    return NextResponse.json({ error: 'OTP is required' }, { status: 400 });

  // ── 3. Find valid OTP ──────────────────────────────────────────────────────
  const { data: otpRecord, error: otpError } = await supabaseAdmin
    .from('otp_logs')
    .select('*')
    .eq('otp_code', otp.trim())
    .eq('purpose', 'email-change')
    .eq('is_used', false)
    .gt('expires_at', new Date().toISOString())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (otpError || !otpRecord)
    return NextResponse.json({ error: 'Invalid or expired OTP' }, { status: 400 });

  // ── 4. New email is stored in the email column ─────────────────────────────
  const newEmail = otpRecord.email;

  // ── 5. Update email in users table ────────────────────────────────────────
  const { error: updateError } = await supabaseAdmin
    .from('users')
    .update({ email: newEmail, updated_at: new Date().toISOString() })
    .eq('id', session.user_id);

  if (updateError) {
    console.error('Email update error:', updateError.message);
    return NextResponse.json({ error: 'Failed to update email' }, { status: 500 });
  }

  // ── 6. Mark OTP as used ────────────────────────────────────────────────────
  await supabaseAdmin
    .from('otp_logs')
    .update({ is_used: true })
    .eq('id', otpRecord.id);

  return NextResponse.json({ success: true, new_email: newEmail }, { status: 200 });
}
