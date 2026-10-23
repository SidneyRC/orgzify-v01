// THIS FILE GOES IN: lib/buildEventSeoText.ts (REPLACES existing file)
// One rule for the search description of an event (Google). Pure function.
// Format: Name · Sat, 17 Oct 2026, 5:00 PM (+2 more dates) · Venue, Area, City (also Pune). Type · Sub event by Organiser. Ages 8+. Tickets from ₹299.
// Built fresh on every page load, so the date rolls forward by itself.
// Too long? price, then age, then organiser are dropped (in that order).
// "opts.city" lets a city link describe that city's sessions first (not wired yet).
// openSessions / allSessions / lowestPrice are shared with lib/buildEventJsonLd.ts (one rule for both).

const MAX = 160
export type Session = { date: string; time: string; venue: any; id: string }

const fmtDay = (d: string) => {
  const dt = new Date(d)
  const wd = dt.toLocaleDateString('en-GB', { weekday: 'short', timeZone: 'UTC' })
  return wd + ', ' + dt.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
}
const fmtTime = (t: string) => {
  const [h, m] = String(t || '').split(':')
  const hr = parseInt(h)
  if (isNaN(hr)) return ''
  return (hr % 12 === 0 ? 12 : hr % 12) + ':' + (m || '00') + ' ' + (hr >= 12 ? 'PM' : 'AM')
}

export function allSessions(event: any): Session[] {
  const out: Session[] = []
  for (const v of event.venues || []) for (const d of v.dates || []) for (const t of d.times || []) {
    out.push({ date: d.event_date, time: t.start_time, venue: v, id: t.id })
  }
  return out.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time))
}

const stillOn = (s: Session, mins: number) => new Date(`${s.date}T${s.time}`).getTime() + mins * 60000 > Date.now()

// Sessions that have not ended yet and are not hidden (a session with no open tickets is hidden).
export function openSessions(event: any): Session[] {
  const mins = event.event_duration_minutes || 0
  return allSessions(event).filter(s => stillOn(s, mins) && (!event.upcomingSlotIds || event.upcomingSlotIds.includes(s.id)))
}

export function lowestPrice(event: any, ids: string[]): number | null {
  let low: number | null = null
  for (const id of ids) for (const t of event.ticketsBySlot?.[id] || []) {
    if (t.soldOut || (t.quantity > 0 && t.soldCount >= t.quantity)) continue
    if (low === null || t.price < low) low = t.price
  }
  return low
}

export function buildEventSeoText(event: any, opts: { city?: string } = {}): string {
  const all = allSessions(event)
  const open = openSessions(event)
  const want = (opts.city || '').trim().toLowerCase()
  const local = want ? open.filter(s => String(s.venue.city_name || '').toLowerCase() === want) : []
  const pick = local[0] || open[0] || all[all.length - 1]
  if (!pick) return String(event.name || '')

  const ended = open.length === 0
  const dates = new Set(open.map(s => s.date))
  dates.delete(pick.date)
  const more = dates.size > 0 ? ` (+${dates.size} more date${dates.size > 1 ? 's' : ''})` : ''
  const when = ended ? 'Ended' : [fmtDay(pick.date), fmtTime(pick.time)].filter(Boolean).join(', ') + more

  const v = pick.venue
  const here = v.city_name || ''
  const others = [...new Set(open.map(s => s.venue.city_name).filter((c: string) => c && c !== here))]
  const also = !ended && others.length ? ` (also ${others.slice(0, 2).join(', ')}${others.length > 2 ? ' +' + (others.length - 2) + ' more' : ''})` : ''
  const where = (v.is_virtual ? 'Virtual event' : [v.external_name, v.area, v.city_name].filter(Boolean).join(', ')) + also

  const type = [event.category_name, event.sub_category_name].filter(Boolean).join(' · ')
  const org = event.organiser_name
  const kind = (withOrg: boolean) => (type ? type + ' event' + (withOrg && org ? ' by ' + org : '') + '.' : withOrg && org ? 'Event by ' + org + '.' : '')
  const age = Number(event.min_age) > 0 ? 'Ages ' + Number(event.min_age) + '+.' : ''
  const low = ended ? null : lowestPrice(event, open.map(s => s.id))
  const price = low === null ? '' : low === 0 ? 'Free entry.' : 'Tickets from ₹' + low + '.'

  const joined = [event.name, when, where].filter(Boolean).join(' · '); const head = joined.endsWith('.') ? joined : joined + '.'
  const build = (o: boolean, a: boolean, p: boolean) => [head, kind(o), a ? age : '', p ? price : ''].filter(Boolean).join(' ')
  const tries: boolean[][] = [[true, true, true], [true, true, false], [true, false, false]]
  for (const [o, a, p] of tries) { const t = build(o, a, p); if (t.length <= MAX) return t }
  return build(false, false, false)
}
