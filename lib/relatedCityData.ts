// THIS FILE GOES IN: lib/relatedCityData.ts (NEW FILE)
// City lookups for "You May Also Like" (used by lib/getRelatedEvents.ts). Database reads only.
// Organiser city = operating-office address, else registered address (table entity_addresses).
// A virtual event counts for its organiser's city; a physical session counts for its venue's city.
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { VIRTUAL_VENUE_ID } from '@/lib/constants'

export type VenueLink = { eventVenueId: string; eventId: string; cityId: string }

export async function loadOrganiserCities(entityIds: string[]): Promise<Record<string, string>> {
  const out: Record<string, string> = {}
  if (!entityIds.length) return out
  const { data } = await supabaseAdmin.from('entity_addresses').select('entity_id, address_type, city').in('entity_id', entityIds).in('address_type', ['registered', 'operating'])
  // registered first, then operating, so the operating-office city wins when both exist
  for (const type of ['registered', 'operating']) for (const r of data || []) if (r.city && r.address_type === type) out[r.entity_id] = r.city
  return out
}

export async function loadVenueLinks(events: any[], orgCity: Record<string, string>): Promise<VenueLink[]> {
  if (!events.length) return []
  const owner = new Map(events.map(e => [e.id, e.entity_id]))
  const { data } = await supabaseAdmin.from('event_venues').select('id, event_id, venue_id, venues(city_id)').in('event_id', events.map(e => e.id))
  const links: VenueLink[] = []
  for (const r of (data || []) as any[]) {
    const cityId = r.venue_id === VIRTUAL_VENUE_ID ? orgCity[owner.get(r.event_id) as string] : r.venues?.city_id
    if (cityId) links.push({ eventVenueId: r.id, eventId: r.event_id, cityId })
  }
  return links
}

// The event's own "home" city: the city of its next upcoming session,
// else its first venue, else the organiser's city.
export function homeCity(event: any, links: VenueLink[], orgCity: Record<string, string>): string | null {
  const mine = links.filter(l => l.eventId === event.id)
  const next = (event.venues || []).find((v: any) => (v.dates || []).some((d: any) => (d.times || []).some((t: any) => t.id === event.nextUpcomingSlotId)))
  const pick = mine.find(l => l.eventVenueId === next?.id) || mine[0]
  return pick?.cityId || orgCity[event.entity_id] || null
}

export async function loadCityName(cityId: string): Promise<string> {
  const { data } = await supabaseAdmin.from('locations').select('name').eq('id', cityId).maybeSingle()
  return data?.name || ''
}
