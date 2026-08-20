import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const { identifier, password } = await req.json();

    if (!identifier || !password) {
      return NextResponse.json({ error: 'Email and password are required.' }, { status: 400 });
    }

    // Find user by email
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, password_hash, account_status, is_email_verified, is_super_admin')
      .eq('email', identifier.toLowerCase().trim())
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

    // Check account status
    if (user.account_status !== 'active') {
      return NextResponse.json({ error: 'Your account has been suspended. Please contact support.' }, { status: 403 });
    }

    // Check email verified
    if (!user.is_email_verified) {
      return NextResponse.json({ error: 'Please verify your email before signing in.' }, { status: 403 });
    }

    // Compare password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password.' }, { status: 401 });
    }

        // Update last login timestamp
    await supabase.from('users').update({ last_login_at: new Date().toISOString() }).eq('id', user.id);

    // Get default profile (includes full_name for display cookie)
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, is_complete, full_name, photo_url')
      .eq('user_id', user.id)
      .eq('relationship', 'Self')
      .single();

    // Generate JWT token
    const token = await new SignJWT({ user_id: user.id, profile_id: profile?.id, is_super_admin: user.is_super_admin ?? false })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Extract first name for display cookie
    const parts = profile?.full_name?.split(' ') ?? [];
const firstName = parts.find((p: string) => !p.endsWith('.')) ?? parts[0] ?? '';
    const avatar = profile?.photo_url ?? '';

    const cookieOptions = {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    };

    // Set auth token + display cookie
    const response = NextResponse.json({ success: true, is_complete: profile?.is_complete ?? false });
    response.cookies.set('orgzify_token', token, { ...cookieOptions, httpOnly: true });
    response.cookies.set('zy_display', firstName, cookieOptions);
    response.cookies.set('zy_avatar', avatar, cookieOptions);

    return response;

  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
