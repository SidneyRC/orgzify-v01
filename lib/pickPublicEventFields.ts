// THIS FILE GOES IN: lib/pickPublicEventFields.ts (NEW FILE)
// ALLOW-LIST for the public event page: only the fields the page screens use are sent to the browser.
// Anything not listed here (internal user ids, commission, virtual access details, older copies...)
// never reaches the page source, including fields added to the database in future.
// Payment details (bank / UPI / QR) are emptied too; they load after login from /event/booking-details.
// To show a new field on the public page, add its name to KEEP.
import { stripPrivateEventData } from '@/lib/stripPrivateEventData'

const KEEP = [
  'id', 'name', 'slug', 'process_id', 'status', 'visibility', 'event_format', 'event_status', 'accessType',
  'category_name', 'sub_category_name', 'organiser_name', 'organiser_logo_url', 'min_age', 'languages', 'event_duration_minutes',
  'description', 'terms_conditions', 'published', 'booking_open', 'social_youtube_url', 'video_links',
  'ticketsBySlot', 'slotStatusById', 'upcomingSlotIds', 'pastSlotIds', 'nextUpcomingSlotId', 'lowestActivePrice', 'hasFastFilling', 'noSessionsLeft',
  'payment', 'recommendations',
]

const pick = (o: any, keys: string[]) => {
  const r: any = {}
  for (const k of keys) if (o && o[k] !== undefined) r[k] = o[k]
  return r
}
const list = (a: any) => (Array.isArray(a) ? a : [])
const media = (a: any) => list(a).map(m => pick(m, ['id', 'file_url', 'media_type', 'is_default_banner', 'sort_order', 'width', 'height', 'caption']))
const venues = (a: any) => list(a).map(v => ({
  ...pick(v, ['id', 'is_virtual', 'external_name', 'line1', 'area', 'city_name']),
  dates: list(v.dates).map((d: any) => ({ id: d.id, event_date: d.event_date, times: list(d.times).map((t: any) => pick(t, ['id', 'start_time', 'end_time'])) })),
}))

export function pickPublicEventFields(event: any) {
  if (!event) return event
  return stripPrivateEventData({
    ...pick(event, KEEP),
    banners: media(event.banners),
    gallery: media(event.gallery),
    venues: venues(event.venues),
    artists: list(event.artists).map(a => pick(a, ['id', 'name', 'photo_url', 'speciality_name', 'role'])),
    sponsors: list(event.sponsors).map(s => pick(s, ['id', 'name', 'logo_url', 'sponsor_type'])),
  })
}
