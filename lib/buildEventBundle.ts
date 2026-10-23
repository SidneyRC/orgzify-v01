// lib/buildEventBundle.ts (REPLACES existing file)
// Builds the full public-facing event data bundle (category, venues,
// tickets, media, artists, sponsors, payment) from a given event row.
// Used both to shape live/preview event pages AND to build the snapshot
// saved into events.last_approved_snapshot when an event is approved.
// Sub-categories are read from event_sub_categories (several per event);
// the old single sub_category_id column is only a fallback for older events.

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { buildVenues, buildTickets, buildPayment } from '@/lib/eventBundleHelpers'
import { artistsWithSpeciality } from '@/lib/artistRoles'

export async function buildEventBundle(event: any) {
  const [{ data: category }, { data: subRows }, { data: oldSub }, { data: entity }] = await Promise.all([
    event.category_id ? supabaseAdmin.from('event_categories').select('name').eq('id', event.category_id).maybeSingle() : Promise.resolve({ data: null }),
    supabaseAdmin.from('event_sub_categories').select('event_categories(name)').eq('event_id', event.id).order('created_at'),
    event.sub_category_id ? supabaseAdmin.from('event_categories').select('name').eq('id', event.sub_category_id).maybeSingle() : Promise.resolve({ data: null }),
    event.entity_id ? supabaseAdmin.from('entities').select('display_name').eq('id', event.entity_id).maybeSingle() : Promise.resolve({ data: null }),
  ])

  const subNames: string[] = (subRows || []).map((r: any) => r.event_categories?.name).filter(Boolean)
  if (subNames.length === 0 && oldSub?.name) subNames.push(oldSub.name)

  const [{ data: media }, { data: eventVenues }, { data: ticketTypes }, { data: artistLinks }, { data: sponsorLinks }, { data: bookingMethods }, { data: upiRows }] = await Promise.all([
    supabaseAdmin.from('event_media').select('*').eq('event_id', event.id).order('sort_order'),
    supabaseAdmin.from('event_venues').select('id, venue_id, venues(external_name, line1, area, city_id, state_id, country_id)').eq('event_id', event.id),
    supabaseAdmin.from('event_ticket_types').select('*').eq('event_id', event.id).eq('is_enabled', true).order('display_order'),
    supabaseAdmin.from('event_artist_assignments').select('artist_id, artists(id, name, photo_url, speciality_id)').eq('event_id', event.id),
    supabaseAdmin.from('event_sponsors').select('sponsor_id, sponsor_type, sponsors(id, name, logo_url)').eq('event_id', event.id),
    supabaseAdmin.from('event_booking_methods').select('*').eq('event_id', event.id).maybeSingle(),
    supabaseAdmin.from('event_booking_upi').select('upi_id, display_name').eq('event_id', event.id),
  ])

  const venues = await buildVenues(eventVenues || []); const { data: linkRows } = await supabaseAdmin.from('event_social_links').select('platform, url').eq('event_id', event.id).order('display_order'); const videoLinks: string[] = (linkRows || []).filter((l: any) => String(l.platform || '').toLowerCase() === 'youtube' && l.url).map((l: any) => l.url); const youtubeLink = videoLinks[0] || event.social_youtube_url || null
  const timeIds: string[] = venues.flatMap((v: any) => v.dates.flatMap((d: any) => d.times.map((t: any) => t.id))); const { data: urlRows } = timeIds.length ? await supabaseAdmin.from('event_venue_time_urls').select('event_venue_time_id, booking_url').in('event_venue_time_id', timeIds) : { data: [] as any[] }; const sessionUrls: Record<string, string> = {}; (urlRows || []).forEach((u: any) => { if (u.booking_url) sessionUrls[u.event_venue_time_id] = u.booking_url }); const { ticketsBySlot, nextUpcomingSlotId, upcomingSlotIds, pastSlotIds, lowestActivePrice, hasFastFilling, slotStatusById } =
    await buildTickets(venues, ticketTypes || [], event.event_duration_minutes || 0)

  return {
    ...event, social_youtube_url: youtubeLink, video_links: videoLinks,
    category_name: category?.name || '',
    sub_category_name: subNames.join(', '),
    organiser_name: entity?.display_name || '',
    organiser_logo_url: '',
    banners: (media || []).filter((m: any) => m.section === 'banner'),
    gallery: (media || []).filter((m: any) => m.section === 'gallery'),
    venues,
    ticketsBySlot,
    nextUpcomingSlotId,
    upcomingSlotIds,
    pastSlotIds,
    lowestActivePrice,
    hasFastFilling,
    slotStatusById,
    artists: await artistsWithSpeciality((artistLinks || []).map((a: any) => a.artists).filter(Boolean)),
    sponsors: (sponsorLinks || []).filter((s: any) => s.sponsors).map((s: any) => ({ ...s.sponsors, sponsor_type: s.sponsor_type })),
    payment: buildPayment(bookingMethods, upiRows || [], sessionUrls),
    recommendations: [],
  }
}