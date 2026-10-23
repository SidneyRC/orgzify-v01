// THIS FILE GOES IN: lib/getRelatedEvents.ts (NEW FILE)
// Finds the events for "You May Also Like" on the public event page.
// Same category, live public events (lib/isEventLive.ts), in the visitor's city
// (the chosen city, else this event's own home city).
// Order: same organiser first, then the rest, each by soonest open session.
// Promoted events will go on top later (there is no promoted tag yet).
// Max 30 cards. Uses the approved copy of each event plus the live ticket rules, like the event page.
// Any failure returns an empty list, so the event page never breaks because of this.
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { applyLiveEventFilter } from '@/lib/isEventLive'
import { buildLiveTicketOverrides, applyLiveSessionRules } from '@/lib/eventBundleLiveOverrides'
import { buildRelatedCard } from '@/lib/buildRelatedCard'
import type { RelatedCard } from '@/lib/buildRelatedCard'
import { loadOrganiserCities, loadVenueLinks, homeCity, loadCityName } from '@/lib/relatedCityData'

export type RelatedItem = RelatedCard & { interestedCount: number; interested: boolean }
const MAX_CARDS = 30

// Same live ticket rules as the event page (lib/getEventBySlugOrCode.ts).
export async function liveCopy(row: any, snap: any) {
  const slotIds = Object.keys(snap.ticketsBySlot || {})
  const overrides = await buildLiveTicketOverrides(slotIds)
  const tickets: Record<string, any[]> = {}
  for (const id of slotIds) {
    tickets[id] = (snap.ticketsBySlot[id] || [])
      .map((t: any) => {
        const live = overrides[id + '_' + t.id]
        return live ? { ...t, quantity: live.quantity, soldCount: live.soldCount, fastFilling: live.fastFilling, isEnabled: live.isEnabled } : t
      })
      .filter((t: any) => t.isEnabled !== false)
  }
  return { ...snap, ...applyLiveSessionRules(snap, tickets), published: row.published, booking_open: row.booking_open }
}

async function build(event: any, chosenCityId: string | null, userId: string | null): Promise<RelatedItem[]> {
  if (!event?.category_id) return []
  const { data: rows } = await applyLiveEventFilter(
    supabaseAdmin.from('events').select('id, entity_id, published, booking_open')
  ).eq('category_id', event.category_id).neq('id', event.id).limit(100)
  const list = (rows || []) as any[]
  if (!list.length) return []

  const orgCity = await loadOrganiserCities([...new Set([event.entity_id, ...list.map(r => r.entity_id)])] as string[])
  const links = await loadVenueLinks([event, ...list], orgCity)
  const cityId = chosenCityId || homeCity(event, links, orgCity)
  if (!cityId) return []
  const inCity = new Set(links.filter(l => l.cityId === cityId).map(l => l.eventId))
  const ids = list.filter(r => inCity.has(r.id)).map(r => r.id)
  if (!ids.length) return []

  const [cityName, { data: snaps }] = await Promise.all([
    loadCityName(cityId),
    supabaseAdmin.from('events').select('id, slug, process_id, last_approved_snapshot').in('id', ids),
  ])
  const venueCity: Record<string, string> = {}
  for (const l of links) venueCity[l.eventVenueId] = l.cityId
  const sameOrg = new Set(list.filter(r => r.entity_id === event.entity_id).map(r => r.id))

  const built = await Promise.all((snaps || []).filter((s: any) => s.last_approved_snapshot).map(async (s: any) => {
    const copy = await liveCopy(list.find(r => r.id === s.id), s.last_approved_snapshot)
    return buildRelatedCard({ ...copy, slug: s.slug, process_id: s.process_id }, { cityId, cityName, venueCity })
  }))
  const cards = built.filter(Boolean) as RelatedCard[]
  cards.sort((a, b) => (Number(!sameOrg.has(a.id)) - Number(!sameOrg.has(b.id))) || a.sortKey.localeCompare(b.sortKey))
  const top = cards.slice(0, MAX_CARDS)

  const counts = await Promise.all(top.map(c => supabaseAdmin.from('event_interests').select('id', { count: 'exact', head: true }).eq('event_id', c.id)))
  const { data: mine } = userId && top.length
    ? await supabaseAdmin.from('event_interests').select('event_id').eq('user_id', userId).in('event_id', top.map(c => c.id))
    : { data: [] as any[] }
  const mineSet = new Set((mine || []).map((m: any) => m.event_id))
  return top.map((c, i) => ({ ...c, interestedCount: counts[i].count || 0, interested: mineSet.has(c.id) }))
}

export async function getRelatedEvents(event: any, chosenCityId: string | null, userId: string | null): Promise<RelatedItem[]> {
  try { return await build(event, chosenCityId, userId) } catch (e: any) { console.error('getRelatedEvents:', e?.message); return [] }
}
