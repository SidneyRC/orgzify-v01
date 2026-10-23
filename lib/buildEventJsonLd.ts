// THIS FILE GOES IN: lib/buildEventJsonLd.ts (NEW FILE)
// Hidden Google data for the public event page: ONE Event entry per upcoming
// session (own date, time, venue, city, price), so Google learns every date and place.
// Past sessions are skipped; an ended event keeps its last session so the page still has data.
// Uses the same session rules as the search description (lib/buildEventSeoText.ts).
// Pure function, built live on every page load.
import { allSessions, openSessions, lowestPrice } from '@/lib/buildEventSeoText'
import { pickShareImage } from '@/lib/buildEventShareMeta'

const BASE_URL = 'https://www.orgzify.com'
const SCHEMA = 'https://schema.org/'

// "2026-10-17" + "17:00:00" -> "2026-10-17T17:00:00" (no timezone: read as the venue's local time)
const iso = (d: string, t: string) => {
  const tm = String(t || '00:00:00')
  return d + 'T' + (tm.length === 5 ? tm + ':00' : tm.slice(0, 8))
}

export function buildEventJsonLd(event: any, slug: string) {
  const url = BASE_URL + '/event/' + (event.slug || slug)
  const image = pickShareImage(event) || undefined
  const status = SCHEMA + (event.event_status === 'cancelled' ? 'EventCancelled' : 'EventScheduled')
  const open = openSessions(event)
  const sessions = open.length > 0 ? open : allSessions(event).slice(-1)

  return sessions.map(s => {
    const v = s.venue
    const price = lowestPrice(event, [s.id])
    return {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: event.name,
      url,
      image,
      startDate: iso(s.date, s.time),
      eventStatus: status,
      eventAttendanceMode: SCHEMA + (v.is_virtual ? 'OnlineEventAttendanceMode' : 'OfflineEventAttendanceMode'),
      location: v.is_virtual
        ? { '@type': 'VirtualLocation', url }
        : { '@type': 'Place', name: v.external_name, address: { '@type': 'PostalAddress', streetAddress: v.line1 || undefined, addressLocality: v.city_name || v.area || undefined } },
      organizer: event.organiser_name ? { '@type': 'Organization', name: event.organiser_name } : undefined,
      offers: open.length === 0 || price === null ? undefined : { '@type': 'Offer', url, price, priceCurrency: 'INR', availability: SCHEMA + 'InStock' },
    }
  })
}
