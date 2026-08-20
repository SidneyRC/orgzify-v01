import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin';
import { SignJWT } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json({ success: false, error: 'Email and OTP are required.' }, { status: 400 });
    }

    // Find valid OTP
    const { data: otpRecord, error: otpError } = await supabaseAdmin
      .from('otp_logs')
      .select('id, expires_at, is_used')
      .eq('email', email.toLowerCase().trim())
      .eq('otp_code', otp)
      .eq('purpose', 'otp-login')
      .eq('is_used', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (otpError || !otpRecord) {
      return NextResponse.json({ success: false, error: 'Invalid OTP.' }, { status: 400 });
    }

    if (new Date(otpRecord.expires_at) < new Date()) {
      return NextResponse.json({ success: false, error: 'OTP has expired. Please resend.' }, { status: 400 });
    }

    // Mark OTP as used
    await supabaseAdmin.from('otp_logs').update({ is_used: true }).eq('id', otpRecord.id);

    // Get user
    const { data: user } = await supabaseAdmin
      .from('users')
      .select('id')
      .eq('email', email.toLowerCase().trim())
      .single();

    if (!user) {
      return NextResponse.json({ success: false, error: 'User not found.' }, { status: 404 });
    }

        // Update last login timestamp
    await supabaseAdmin.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);

    // Get default profile
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id, is_complete, full_name, photo_url')
      .eq('user_id', user.id)
      .eq('relationship', 'Self')
      .single();

    // Generate JWT
    const token = await new SignJWT({ user_id: user.id, profile_id: profile?.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const firstName = profile?.full_name?.split(' ')[0] ?? '';
    const avatar = profile?.photo_url ?? '';

    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    };

    const response = NextResponse.json({ success: true, is_complete: profile?.is_complete ?? false });
    response.cookies.set('orgzify_token', token, { ...cookieOptions, httpOnly: true });
    response.cookies.set('zy_display', firstName, cookieOptions);
    response.cookies.set('zy_avatar', avatar, cookieOptions);

    return response;

  } catch (err) {
    console.error('[login-otp/verify] Unexpected error:', err);
    return NextResponse.json({ success: false, error: 'Something went wrong.' }, { status: 500 });
  }
}
