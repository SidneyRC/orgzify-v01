// THIS FILE GOES IN: app/(admin)/company/clear/route.ts (NEW FILE)
// Clears the active context cookie — called when clicking "Admin Panel"

import { NextResponse } from 'next/server'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.set('orgzify_context', '', {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax',
    expires: new Date(0), maxAge: 0, path: '/',
  })
  return response
}
