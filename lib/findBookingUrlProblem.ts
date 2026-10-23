// THIS FILE GOES IN: lib/findBookingUrlProblem.ts (NEW FILE)
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { bookingUrlProblem } from '@/lib/bookingUrlProblem'

// Returns a short message if External URL is on but a URL is missing, or null if all is fine.
export async function findBookingUrlProblem(eventId: string): Promise<string | null> {
  const { data: method } = await supabaseAdmin.from('event_booking_methods').select('*').eq('event_id', eventId).maybeSingle()
  if (!method?.url_enabled) return null
  const { data: venues } = await supabaseAdmin
    .from('event_venues')
    .select('venues(external_name), event_venue_dates(event_date, event_venue_times(start_time, event_venue_time_urls(booking_url)))')
    .eq('event_id', eventId)
  return bookingUrlProblem(method, (venues || []) as any[])
}
