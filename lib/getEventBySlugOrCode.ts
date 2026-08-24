// lib/getEventBySlugOrCode.ts
// Looks up an event by process_id (preview/share link, always visible)
// or by slug (public/SEO link, subject to visibility rules).
// Shapes the result to match what OREV1-130-EventPageClient.tsx expects.

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function getEventBySlugOrCode(value: string) {
  let accessType: 'preview' | 'public' = 'public'
  let event: any = null

  const { data: byCode, error: codeErr } = await supabaseAdmin
    .from('events')
    .select('*')
    .eq('process_id', value)
    .maybeSingle()
  if (codeErr) console.error('getEventBySlugOrCode (process_id lookup):', codeErr.message)

  if (byCode) {
    event = byCode
    accessType = 'preview'
  } else {
    const { data: bySlug, error: slugErr } = await supabaseAdmin
      .from('events')
      .select('*')
      .eq('slug', value)
      .maybeSingle()
    if (slugErr) console.error('getEventBySlugOrCode (slug lookup):', slugErr.message)
    event = bySlug
  }

  if (!event) return null

  const [{ data: category }, { data: subCategory }, { data: entity }] = await Promise.all([
    event.category_id ? supabaseAdmin.from('event_categories').select('name').eq('id', event.category_id).maybeSingle() : Promise.resolve({ data: null }),
    event.sub_category_id ? supabaseAdmin.from('event_categories').select('name').eq('id', event.sub_category_id).maybeSingle() : Promise.resolve({ data: null }),
    event.entity_id ? supabaseAdmin.from('entities').select('display_name').eq('id', event.entity_id).maybeSingle() : Promise.resolve({ data: null }),
  ])
  event.categories = category
  event.sub_categories = subCategory
  event.entities = entity

  const [{ data: media }, { data: eventVenues }, { data: ticketTypes }, { data: artistLinks }, { data: sponsorLinks }, { data: bookingMethods }, { data: upiRows }] = await Promise.all([
    supabaseAdmin.from('event_media').select('*').eq('event_id', event.id).order('sort_order'),
    supabaseAdmin.from('event_venues').select('id, venue_id, venues(external_name, line1, area, city_id, state_id, country_id)').eq('event_id', event.id),
    supabaseAdmin.from('event_ticket_types').select('*').eq('event_id', event.id).eq('is_enabled', true).order('display_order'),
    supabaseAdmin.from('event_artist_assignments').select('artist_id, artists(id, name, photo_url)').eq('event_id', event.id),
    supabaseAdmin.from('event_sponsors').select('sponsor_id, sponsors(id, name, logo_url)').eq('event_id', event.id),
    supabaseAdmin.from('event_booking_methods').select('*').eq('event_id', event.id).maybeSingle(),
    supabaseAdmin.from('event_booking_upi').select('upi_id, display_name').eq('event_id', event.id),
  ])

  const venues = await buildVenues(eventVenues || [])
  const { ticketsBySlot, nextUpcomingSlotId } = await buildTickets(venues, ticketTypes || [])

  return {
    ...event,
    accessType,
    category_name: event.categories?.name || '',
    sub_category_name: event.sub_categories?.name || '',
    organiser_name: event.entities?.display_name || '',
    organiser_logo_url: '',
    banners: (media || []).filter((m: any) => m.section === 'banner'),
    gallery: (media || []).filter((m: any) => m.section === 'gallery'),
    venues,
    ticketsBySlot,
    nextUpcomingSlotId,
    artists: (artistLinks || []).map((a: any) => a.artists).filter(Boolean),
    sponsors: (sponsorLinks || []).map((s: any) => s.sponsors).filter(Boolean),
    payment: buildPayment(bookingMethods, upiRows || []),
    recommendations: [],
  }
}

function buildPayment(bm: any, upiRows: any[]) {
  if (!bm) return null
  return {
    upi_enabled: bm.upi_enabled || false,
    upi: upiRows,
    qr_enabled: bm.qr_enabled || false,
    qr_image_url: bm.qr_image_url || '',
    bank_enabled: bm.bank_enabled || false,
    bank_account_name: bm.bank_account_name || '',
    bank_account_number: bm.bank_account_number || '',
    bank_name: bm.bank_name || '',
    bank_ifsc_swift: bm.bank_ifsc_swift || '',
    url_enabled: bm.url_enabled || false,
    external_url: bm.external_url || '',
  }
}

async function buildVenues(eventVenues: any[]) {
  const venues = []
  for (const ev of eventVenues) {
    const { data: dates } = await supabaseAdmin
      .from('event_venue_dates')
      .select('id, event_date')
      .eq('event_venue_id', ev.id)
      .order('event_date')

    const datesWithTimes = []
    for (const d of dates || []) {
      const { data: times } = await supabaseAdmin
        .from('event_venue_times')
        .select('id, start_time, end_time')
        .eq('event_venue_date_id', d.id)
        .order('start_time')
      datesWithTimes.push({ ...d, times: times || [] })
    }

    venues.push({
      id: ev.id,
      external_name: ev.venues?.external_name || '',
      line1: ev.venues?.line1 || '',
      area: ev.venues?.area || '',
      dates: datesWithTimes,
    })
  }
  return venues
}

async function buildTickets(venues: any[], ticketTypes: any[]) {
  const ticketsBySlot: Record<string, any[]> = {}
  const allSlots: { id: string; date: string; time: string }[] = []

  for (const v of venues) {
    for (const d of v.dates) {
      for (const t of d.times) {
        allSlots.push({ id: t.id, date: d.event_date, time: t.start_time })
        const { data: assigned } = await supabaseAdmin
          .from('event_ticket_assignments')
          .select('price, quantity, ticket_type_id')
          .eq('event_venue_time_id', t.id)
          .eq('is_enabled', true)
        ticketsBySlot[t.id] = (assigned || []).map((a: any) => {
          const tt = ticketTypes.find((x: any) => x.id === a.ticket_type_id)
          return { id: a.ticket_type_id, name: tt?.name || '', price: a.price }
        })
      }
    }
  }

  const now = new Date()
  const future = allSlots
    .filter(s => new Date(`${s.date}T${s.time}`) >= now)
    .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())

  const nextUpcomingSlotId = future[0]?.id || allSlots[0]?.id || null
  return { ticketsBySlot, nextUpcomingSlotId }
}