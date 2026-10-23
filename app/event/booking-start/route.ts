// THIS FILE GOES IN: app/event/booking-start/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { startBookingProcess } from '@/lib/createBookingProcess'

// Book Now popup opened: saves the Processing ID (a single option is recorded straight away).
export async function POST(req: NextRequest) {
  try {
    const session = await getSession(req)
    if (!session) return NextResponse.json({ error: 'not_logged_in' }, { status: 401 })
    const b = await req.json()
    if (!b.event_id) return NextResponse.json({ error: 'event_id is required' }, { status: 400 })
    const r = await startBookingProcess({ userId: String(session.user_id), eventId: String(b.event_id), slotId: b.slot_id ? String(b.slot_id).slice(0, 64) : undefined, option: b.option || undefined })
    if ('error' in r) return NextResponse.json({ error: r.error }, { status: 400 })
    return NextResponse.json({ id: r.row.id, code: r.row.process_code })
  } catch (err) {
    console.error('booking-start error:', err)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}
