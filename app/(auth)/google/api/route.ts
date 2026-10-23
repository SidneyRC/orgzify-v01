// THIS FILE GOES IN: app/(auth)/google/api/route.ts (REPLACES existing file)
// Starts "Continue with Google". If the login page passed a "come back to" address (?next=),
// it is kept for 10 minutes (only if it stays inside Orgzify) so the callback can use it.
import { NextRequest, NextResponse } from 'next/server';
import { safeNext } from '@/lib/safeNext';
import { GOOGLE_NEXT_COOKIE } from '@/lib/googleNext';

export async function GET(req: NextRequest) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID!,
    redirect_uri: `${req.nextUrl.origin}/google/callback/api`,
    response_type: 'code',
    scope: 'openid email profile',
    prompt: 'select_account',
  });
  const response = NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
  const next = safeNext(req.nextUrl.searchParams.get('next'));
  if (next) {
    response.cookies.set(GOOGLE_NEXT_COOKIE, next, {
      httpOnly: true, sameSite: 'lax', maxAge: 600, path: '/',
      secure: process.env.NODE_ENV === 'production',
    });
  } else {
    response.cookies.delete(GOOGLE_NEXT_COOKIE);
  }
  return response;
}
