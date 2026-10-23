// THIS FILE GOES IN: lib/bookingUrlProblem.ts (REPLACES existing file)
// One shared rule, used by the Review screen AND the server on Submit.
// Only applies when "External URL" is switched on in Booking Method.
// Returns a short message, or null when nothing is missing or wrong.
import { isWebUrl } from '@/lib/bookingMethodRules'

export function bookingUrlProblem(method: any, venues: any[]): string | null {
  if (!method?.url_enabled) return null
  if (method.url_mode !== 'per_slot') {
    const u = String(method.external_url || '').trim()
    if (!u) return 'Add the booking URL in Booking Method'
    return isWebUrl(u) ? null : 'Booking URL must start with https:// (or http://)'
  }
  for (const v of venues || []) for (const d of v.event_venue_dates || []) for (const t of d.event_venue_times || []) {
    const u = Array.isArray(t.event_venue_time_urls) ? t.event_venue_time_urls[0] : t.event_venue_time_urls
    if (isWebUrl(u?.booking_url)) continue
    const day = new Date(d.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    return `Add a valid booking URL to the ${day}, ${String(t.start_time).slice(0, 5)} session (${v.venues?.external_name || 'Venue'})`
  }
  return null
}
