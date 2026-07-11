import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

const PROTECTED = ['/profile', '/profiles', '/bookings', '/admin', '/company'];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get('orgzify_token')?.value;
  const displayCookie = req.cookies.get('zy_display')?.value;

  const isProtected = PROTECTED.some((r) => pathname.startsWith(r));

  // Not logged in + protected route → login
  if (isProtected && !token) {
    const url = new URL('/login', req.url);
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  const res = NextResponse.next();

  if (token) {
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET);

      // Pass display name via header
      if (displayCookie) res.headers.set('x-zy-display', displayCookie);

      // /admin → super admin only
      if (pathname.startsWith('/admin') && !payload.is_super_admin) {
        const url = new URL('/profiles', req.url);
        url.searchParams.set('error', 'unauthorised');
        return NextResponse.redirect(url);
      }

    } catch {
      // Invalid token — clear cookies + redirect to login
      const url = new URL('/login', req.url);
      const response = NextResponse.redirect(url);
      response.cookies.delete('orgzify_token');
      response.cookies.delete('zy_display');
      return response;
    }
  }

  return res;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};