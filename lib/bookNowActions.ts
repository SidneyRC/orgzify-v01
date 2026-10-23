// THIS FILE GOES IN: lib/bookNowActions.ts (REPLACES the file saved earlier today)
// What happens when a visitor taps Book Now. Browser-only (call from click handlers).
// Logged out -> login page, then back to the event with ?book=1&slot=<session> (OREV1-157 reopens the popup).
// Logged in + only a booking link -> opens the Orgzify forwarding address, which saves the Processing ID and forwards.
// Anything else -> the caller opens the popup (the popup saves the Processing ID itself).

export type SessionLink = { id: string; venue: string; date: string; time: string; url: string }

// Only web addresses are ever shown as links.
export const safeUrl = (u: any): string => {
  const s = String(u || '').trim()
  return s.startsWith('https://') || s.startsWith('http://') ? s : ''
}

// The Orgzify forwarding address for a booking link (records who is sent where, then forwards).
export const goUrl = (eventId: string, slotId: string, pid?: string) =>
  '/event/booking-go?event_id=' + encodeURIComponent(eventId) + '&slot=' + encodeURIComponent(slotId || '') + (pid ? '&pid=' + encodeURIComponent(pid) : '')

// Per-session booking links for sessions that can still be booked.
export function openSessionLinks(event: any): SessionLink[] {
  const urls = event?.payment?.session_urls || {}
  const open: Set<string> | null = event?.upcomingSlotIds ? new Set<string>(event.upcomingSlotIds) : null
  const out: SessionLink[] = []
  for (const v of event?.venues || []) {
    for (const d of v.dates || []) {
      for (const t of d.times || []) {
        const url = safeUrl(urls[t.id])
        const bookable = (!open || open.has(t.id)) && !event?.slotStatusById?.[t.id]?.locked
        if (url && bookable) out.push({ id: t.id, venue: v.external_name || '', date: d.event_date, time: t.start_time, url })
      }
    }
  }
  return out
}

// The session whose link opens straight away, or null when the popup is needed.
export function directLinkSlot(event: any, selectedSlotId: string): string | null {
  const p = event?.payment
  if (!p?.url_enabled || p.upi_enabled || p.qr_enabled || p.bank_enabled || p.pg_enabled) return null
  if (p.url_mode !== 'per_slot') return safeUrl(p.external_url) ? (selectedSlotId || '') : null
  const list = openSessionLinks(event)
  return list.length === 1 ? list[0].id : null
}

// Returns true when the tap was fully handled (sent to login, or the link tab opened).
export function handleBookTap(event: any, isLoggedIn: boolean, slotId: string): boolean {
  if (!isLoggedIn) {
    const next = window.location.pathname + '?book=1&slot=' + encodeURIComponent(slotId || '')
    window.location.href = '/login?next=' + encodeURIComponent(next)
    return true
  }
  const slot = directLinkSlot(event, slotId)
  if (slot !== null) { window.open(goUrl(event.id, slot), '_blank', 'noopener'); return true }
  return false
}
