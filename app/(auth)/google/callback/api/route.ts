import { NextRequest, NextResponse } from 'next/server';
import { SignJWT } from 'jose';
import { supabaseAdmin as supabase } from '@/lib/supabaseAdmin';
import { uploadGooglePhoto } from '@/lib/googlePhotoUpload';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function GET(req: NextRequest) {
  try {
    const code = req.nextUrl.searchParams.get('code');
    const origin = req.nextUrl.origin;
    if (!code) return NextResponse.redirect(`${origin}/login?error=google_failed`);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${origin}/google/callback/api`,
        grant_type: 'authorization_code',
      }),
    });
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) return NextResponse.redirect(`${origin}/login?error=google_failed`);

    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const gUser = await profileRes.json();
    if (!gUser.email) return NextResponse.redirect(`${origin}/login?error=google_failed`);

    const email = gUser.email.toLowerCase().trim();

    let { data: user } = await supabase
      .from('users')
      .select('id, account_status, is_super_admin')
      .eq('email', email)
      .single();

        if (user) {
      if (user.account_status !== 'active') {
        return NextResponse.redirect(`${origin}/login?error=account_suspended`);
      }
      
            await supabase.from('users').update({
        google_id: gUser.id,
        auth_provider: 'google',
        is_email_verified: true,
        last_login_at: new Date().toISOString(),
      }).eq('id', user.id);

      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id')
        .eq('user_id', user.id)
        .eq('relationship', 'Self')
        .maybeSingle();

            if (!existingProfile) {
        const { data: newP } = await supabase.from('profiles').insert({
          user_id: user.id, full_name: gUser.name || '', email,
          relationship: 'Self', profile_status: 'active',
        }).select('id').single();

        if (newP && gUser.picture) {
          const photoUrl = await uploadGooglePhoto(gUser.picture, newP.id);
          if (photoUrl) await supabase.from('profiles').update({ photo_url: photoUrl }).eq('id', newP.id);
        }
      }

    } else {

      const { count } = await supabase.from('users').select('*', { count: 'exact', head: true });
      const zy_id = `ZY${String((count || 0) + 1).padStart(3, '0')}`;

            const { data: newUser, error: userError } = await supabase
        .from('users')
        .insert({
          zy_id, email, google_id: gUser.id, auth_provider: 'google',
          is_email_verified: true, account_status: 'active',
          last_login_at: new Date().toISOString(),
        })
        .select('id, account_status, is_super_admin')
        .single();

      if (userError || !newUser) return NextResponse.redirect(`${origin}/login?error=google_failed`);
      user = newUser;

            const { data: newP2 } = await supabase.from('profiles').insert({
        user_id: user.id, full_name: gUser.name || '', email,
        relationship: 'Self', profile_status: 'active',
      }).select('id').single();

      if (newP2 && gUser.picture) {
        const photoUrl = await uploadGooglePhoto(gUser.picture, newP2.id);
        if (photoUrl) await supabase.from('profiles').update({ photo_url: photoUrl }).eq('id', newP2.id);
      }
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('id, is_complete, full_name, photo_url')
      .eq('user_id', user.id)
      .eq('relationship', 'Self')
      .single();

    const token = await new SignJWT({ user_id: user.id, profile_id: profile?.id, is_super_admin: user.is_super_admin ?? false })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('7d')
      .sign(JWT_SECRET);

    const parts = profile?.full_name?.split(' ') ?? [];
    const firstName = parts.find((p: string) => !p.endsWith('.')) ?? parts[0] ?? '';
    const avatar = profile?.photo_url ?? '';

    const cookieOptions = {
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    };

    const redirectPath = profile?.is_complete ? '/' : '/profile/edit';
    const response = NextResponse.redirect(`${origin}${redirectPath}`);
    response.cookies.set('orgzify_token', token, { ...cookieOptions, httpOnly: true });
    response.cookies.set('zy_display', firstName, cookieOptions);
    response.cookies.set('zy_avatar', avatar, cookieOptions);
    return response;

  } catch (err) {
    console.error('Google login error:', err);
    return NextResponse.redirect(`${req.nextUrl.origin}/login?error=google_failed`);
  }
}