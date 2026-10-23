// THIS FILE GOES IN: app/event/booking-choose/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { setProcessOption } from '@/lib/createBookingProcess'

// The visitor picked an option in the popup: adds it to their own Processing ID.
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'not_logged_in' }, { status: 401 })
    const b = await req.json()
    if (!b.process_id || !b.option) return NextResponse.json({ error: 'process_id and option are required' }, { status: 400 })
    const r = await setProcessOption(String(session.user_id), String(b.process_id), String(b.option), b.provider ? String(b.provider).slice(0, 50) : undefined)
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400 })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('booking-choose error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
