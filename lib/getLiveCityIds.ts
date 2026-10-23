// THIS FILE GOES IN: lib/getLiveCityIds.ts (REPLACES the version sent earlier today)
// Cities that have at least one LIVE event (lib/isEventLive.ts) with a session still open.
// FAST: one light database read of the tables (no approved copies), so it is real time.
// Open session = not ended yet (end time, else end of that day) AND at least one ticket
// that is switched on and not sold out. A virtual event counts for its organiser's city.
// Used by app/(customer)/citypicker/api/route.ts and .../nearby/route.ts.
// counts = live events per city id; eventVenueIds = event venues that have an open session.
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { applyLiveEventFilter } from '@/lib/isEventLive'
import { loadOrganiserCities } from '@/lib/relatedCityData'
import { VIRTUAL_VENUE_ID } from '@/lib/constants'

export type LiveCities = { counts: Record<string, number>; eventVenueIds: string[] }

const SELECT = 'id, entity_id, event_venues(id, venue_id, venues(city_id), event_venue_dates(event_date, event_venue_times(start_time, end_time, event_ticket_assignments(quantity, sold_count, is_enabled))))'

function sessionOpen(date: string, t: any, now: number): boolean {
  const hasTicket = (t.event_ticket_assignments || []).some((a: any) => a.is_enabled && !(a.quantity > 0 && a.sold_count >= a.quantity))
  if (!hasTicket) return false
  const start = new Date(`${date}T${t.start_time}`).getTime()
  let end = new Date(`${date}T${t.end_time || '23:59:59'}`).getTime()
  if (end < start) end += 86400000
  return end > now
}

export async function getLiveCities(): Promise<LiveCities> {
  const out: LiveCities = { counts: {}, eventVenueIds: [] }
  const { data, error } = await applyLiveEventFilter(supabaseAdmin.from('events').select(SELECT))
  if (error) throw new Error(error.message)
  const events = (data || []) as any[]
  if (!events.length) return out

  const orgCity = await loadOrganiserCities([...new Set(events.map(e => e.entity_id))] as string[])
  const now = Date.now()
  const venueSet = new Set<string>()
  for (const e of events) {
    const cities = new Set<string>()
    for (const ev of e.event_venues || []) {
      const cityId = ev.venue_id === VIRTUAL_VENUE_ID ? orgCity[e.entity_id] : ev.venues?.city_id
      if (!cityId) continue
      const open = (ev.event_venue_dates || []).some((d: any) =>
        (d.event_venue_times || []).some((t: any) => sessionOpen(d.event_date, t, now)))
      if (!open) continue
      cities.add(cityId)
      venueSet.add(ev.id)
    }
    for (const c of cities) out.counts[c] = (out.counts[c] ?? 0) + 1
  }
  out.eventVenueIds = [...venueSet]
  return out
}
