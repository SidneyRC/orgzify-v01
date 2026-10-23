// THIS FILE GOES IN: lib/buildRelatedCard.ts (REPLACES existing file)
// Turns one live event into the small card shown in "You May Also Like".
// Pure function, no database. Returns null when the event has no open session in the city.
// Reuses openSessions + lowestPrice (lib/buildEventSeoText.ts) and pickShareImage (lib/buildEventShareMeta.ts).
// City rule: a session counts for a city when its venue's city id matches.
// venueCity maps each event venue id to a city id (a virtual venue maps to the organiser's city).
// The event must already carry the live ticket rules (applyLiveSessionRules), as the event page does.
// Place lines: virtual = "Online"; one venue = venue name + small "area, city"; several venues = "Multiple venues".
import { openSessions, lowestPrice } from '@/lib/buildEventSeoText'
import { pickShareImage } from '@/lib/buildEventShareMeta'

export type CardContext = { cityId: string; cityName: string; venueCity: Record<string, string> }
export type RelatedCard = {
  id: string; href: string; name: string; image: string; category: string
  when: string; moreDates: number; venue: string; venueSub: string; isVirtual: boolean
  price: string; button: string; sortKey: string
}

const fmtWhen = (date: string, time: string) => {
  const d = new Date(date)
  const wd = d.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })
  const dm = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
  const [h, m] = String(time || '').split(':')
  const hr = parseInt(h)
  const t = isNaN(hr) ? '' : ', ' + (hr % 12 === 0 ? 12 : hr % 12) + ':' + (m || '00') + ' ' + (hr >= 12 ? 'PM' : 'AM')
  return wd + ', ' + dm + t
}

export function buildRelatedCard(event: any, ctx: CardContext): RelatedCard | null {
  const inCity = openSessions(event).filter(s => ctx.venueCity[s.venue.id] === ctx.cityId)
  if (inCity.length === 0) return null

  const first = inCity[0]
  const v = first.venue
  const isVirtual = !!v.is_virtual
  const venueIds = new Set(inCity.filter(s => !s.venue.is_virtual).map(s => s.venue.id))
  const low = lowestPrice(event, inCity.map(s => s.id))
  const closed = event.booking_open === false
  const button = closed ? 'Booking Closed' : low === null ? 'Sold out' : ''
  const areaCity = [v.area, v.city_name || ctx.cityName].filter(Boolean).join(', ')
  const several = !isVirtual && venueIds.size > 1

  return {
    id: event.id,
    href: '/event/' + (event.slug || event.process_id),
    name: event.name,
    image: pickShareImage(event),
    category: [event.category_name, event.sub_category_name].filter(Boolean).join(' • '),
    when: fmtWhen(first.date, first.time),
    moreDates: new Set(inCity.map(s => s.date)).size - 1,
    venue: isVirtual ? 'Online' : several ? 'Multiple venues' : v.external_name || areaCity,
    venueSub: isVirtual || several || !v.external_name ? '' : areaCity,
    isVirtual,
    price: low === null ? '' : low === 0 ? 'Free' : '₹' + low + ' onwards',
    button,
    sortKey: first.date + first.time,
  }
}
