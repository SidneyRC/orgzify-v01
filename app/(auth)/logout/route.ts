import { NextRequest, NextResponse } from 'next/server';

export async function POST() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('orgzify_token', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
    maxAge: 0,
    path: '/',
  });
  response.cookies.set('zy_display', '', { expires: new Date(0), maxAge: 0, path: '/' });
  response.cookies.set('zy_avatar', '', { expires: new Date(0), maxAge: 0, path: '/' });
  return response;
}
export async function GET(req: NextRequest) {
  const next = req.nextUrl.searchParams.get('next') ?? '/login';
  const response = NextResponse.redirect(new URL(next, req.url));
  response.cookies.set('orgzify_token', '', { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', expires: new Date(0), maxAge: 0, path: '/' });
  response.cookies.set('zy_display', '', { expires: new Date(0), maxAge: 0, path: '/' });
  response.cookies.set('zy_avatar', '', { expires: new Date(0), maxAge: 0, path: '/' });
  return response;
}