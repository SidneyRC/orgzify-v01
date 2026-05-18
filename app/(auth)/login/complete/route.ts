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
      .select('id, email, password_hash, account_status, is_email_verified')
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

    // Get default profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, is_complete')
      .eq('user_id', user.id)
      .eq('relationship', 'Self')
      .single();

    // Generate JWT token
    const token = await new SignJWT({ user_id: user.id, profile_id: profile?.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Set cookie and return
    const response = NextResponse.json({ success: true, is_complete: profile?.is_complete ?? false });
    response.cookies.set('orgzify_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    });

    return response;

  } catch (err) {
    console.error('Login error:', err);
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 });
  }
}
