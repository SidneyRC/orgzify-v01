// OREV1-033 — Email Change: Send OTP
// Route: POST /profile/email/send-otp
// Sends OTP to the new email address the user wants to switch to

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { sendEmail } from '@/lib/sendEmail';

export async function POST(req: NextRequest) {
  // ── 1. Auth ────────────────────────────────────────────────────────────────
  const session = await getSession(req);
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 });

  // ── 2. Parse body ──────────────────────────────────────────────────────────
  const { new_email } = await req.json();

  if (!new_email?.trim())
    return NextResponse.json({ error: 'New email is required' }, { status: 400 });

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(new_email))
    return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });

  const cleanEmail = new_email.toLowerCase().trim();

  // ── 3. Check email not already in use ──────────────────────────────────────
  const { data: existing } = await supabaseAdmin
    .from('users')
    .select('id')
    .eq('email', cleanEmail)
    .single();

  if (existing)
    return NextResponse.json({ error: 'This email is already registered' }, { status: 409 });

  // ── 4. Get user name for email ─────────────────────────────────────────────
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('full_name')
    .eq('id', session.profile_id)
    .single();

  const name = profile?.full_name || 'there';

  // ── 5. Generate OTP ────────────────────────────────────────────────────────
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  // ── 6. Save OTP to otp_logs ────────────────────────────────────────────────
  const { error: insertError } = await supabaseAdmin.from('otp_logs').insert({
    email: cleanEmail,
    otp_code: otp,
    purpose: 'email-change',
    is_used: false,
    expires_at: expiresAt,
  });

  if (insertError) {
    console.error('OTP insert error:', insertError.message);
    return NextResponse.json({ error: 'Failed to generate OTP' }, { status: 500 });
  }

  // ── 7. Send OTP to new email ───────────────────────────────────────────────
  const sent = await sendEmail({ to: cleanEmail, name, otp, purpose: 'email-change' });

  if (!sent)
    return NextResponse.json({ error: 'Failed to send OTP email' }, { status: 500 });

  return NextResponse.json({ success: true }, { status: 200 });
}
