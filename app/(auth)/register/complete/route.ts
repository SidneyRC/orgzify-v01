import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { SignJWT } from 'jose';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function POST(req: NextRequest) {
  try {
    const { fullName, email, password } = await req.json();

    if (!fullName || !email || !password) {
      return NextResponse.json({ error: 'All fields are required.' }, { status: 400 });
    }

    // Check if email already exists
    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (existing) {
      return NextResponse.json({ error: 'Email already registered.' }, { status: 409 });
    }

    // Generate ZY ID
    const { count } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true });

    const zyNum = String((count || 0) + 1).padStart(3, '0');
    const zy_id = `ZY${zyNum}`;

    // Hash password
    const password_hash = await bcrypt.hash(password, 10);

    // Get IP address
    const ip_address = req.headers.get('x-forwarded-for') || 'unknown';

    // Save user to users table
    const { data: newUser, error: userError } = await supabase
      .from('users')
      .insert({ zy_id, email, password_hash, is_email_verified: true, account_status: 'active', ip_address })
      .select('id')
      .single();

    if (userError) {
      console.error('User insert error:', userError.message);
      return NextResponse.json({ error: 'Unable to create an account!' }, { status: 500 });
    }

    // Save basic profile
    const { data: newProfile, error: profileError } = await supabase
      .from('profiles')
      .insert({ user_id: newUser.id, full_name: fullName, email, relationship: 'Self', profile_status: 'active', ip_address })
      .select('id')
      .single();

    if (profileError) {
      console.error('Profile insert error:', profileError.message);
    }

    // Generate JWT token
    const token = await new SignJWT({ user_id: newUser.id, profile_id: newProfile?.id })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    // Set JWT as httpOnly cookie and return success
    const response = NextResponse.json({ success: true });
    response.cookies.set('orgzify_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    });

    return response;

  } catch (err) {
    console.error('Register error:', err);
    return NextResponse.json({ error: 'Unable to create an account!' }, { status: 500 });
  }
}
