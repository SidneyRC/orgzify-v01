// THIS FILE GOES IN: app/event/booking-go/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { applyLiveEventFilter } from '@/lib/isEventLive'
import { approvedLinkFor } from '@/lib/bookingProcessRules'
import { startBookingProcess, setProcessOption } from '@/lib/createBookingProcess'

// Book Now for a booking link: saves the Processing ID (with the site the visitor is sent to), then forwards.
// The link is read from the APPROVED copy, so an unapproved edit never goes live.
export async function GET(req: NextRequest) {
  const p = req.nextUrl.searchParams
  const eventId = p.get('event_id') || ''
  const slot = (p.get('slot') || '').slice(0, 64)
  const pid = p.get('pid') || ''
  const origin = req.nextUrl.origin
  try {
    const session = await getSession(req)
    const { data: ev } = await applyLiveEventFilter(supabaseAdmin.from('events').select('id, process_id, last_approved_snapshot').eq('id', eventId)).maybeSingle()
    if (!ev) return NextResponse.redirect(origin + '/', 302)
    const back = origin + '/event/' + ev.process_id
    const url = approvedLinkFor(ev.last_approved_snapshot?.payment, slot)
    if (!session || !url) return NextResponse.redirect(back, 302)

    const userId = String(session.user_id)
    let saved: any = pid ? await setProcessOption(userId, pid, 'url', undefined, url) : null
    if (!saved || 'error' in saved) saved = await startBookingProcess({ userId, eventId: ev.id, slotId: slot, option: 'url', targetUrl: url })
    if ('error' in saved) console.error('booking-go: Processing ID not saved:', saved.error)
    return NextResponse.redirect(url, 302)
  } catch (err) {
    console.error('booking-go error:', err)
    return NextResponse.redirect(origin + '/', 302)
  }
}
