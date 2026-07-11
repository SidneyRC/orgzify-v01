// THIS FILE GOES IN: app/customer/context/route.ts (NEW FILE)
// Sets the active context cookie to "customer" whenever a personal page loads

import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  const response = NextResponse.json({ success: true })
  if (session) {
    response.cookies.set('orgzify_context', `customer:${session.user_id}`, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
    })
  }
  return response
}
