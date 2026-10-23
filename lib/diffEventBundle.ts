// THIS FILE GOES IN: lib/diffEventBundle.ts (REPLACES existing file)
// Compares the approved copy of an event with its current draft and lists what changed.
import { diffBookingMethod } from '@/lib/diffBookingMethod'

export type EventChange = { label: string; from?: string; to?: string; note?: string; detail?: string }
type Slot = { id: string; label: string; tickets: Map<string, { name: string; price: number }> }

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })
const venueName = (v: any) => (v.is_virtual ? 'Online' : v.external_name || 'Venue')
const same = (a: any, b: any) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null)
const ids = (x: any[]) => (x || []).map(i => i.id)
const plain = (h: any) => String(h || '').replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

function short(c: EventChange[], label: string, a: any, b: any, f: (x: any) => string = x => String(x ?? '—')) {
  if (!same(a, b)) c.push({ label, from: f(a), to: f(b) })
}
// Long text: show the part of the old and new text where they start to differ.
function long(c: EventChange[], label: string, a: any, b: any) {
  if ((a || '').trim() === (b || '').trim()) return
  const pa = plain(a), pb = plain(b)
  if (pa === pb) { c.push({ label, note: 'Formatting changed' }); return }
  let i = 0
  while (i < pa.length && i < pb.length && pa[i] === pb[i]) i++
  const s = Math.max(0, i - 25)
  const cut = (x: string) => (s > 0 ? '…' : '') + (x.slice(s, s + 80) || '—') + (x.length > s + 80 ? '…' : '')
  c.push({ label, from: cut(pa), to: cut(pb) })
}
function listed(c: EventChange[], label: string, note: string, items: string[]) {
  if (items.length) c.push({ label, note, detail: items.slice(0, 3).join('; ') + (items.length > 3 ? ` +${items.length - 3} more` : '') })
}

function flatten(b: any) {
  const venues = new Set<string>()
  const slots = new Map<string, Slot>()
  for (const v of b?.venues || []) {
    venues.add(venueName(v))
    for (const d of v.dates || []) for (const t of d.times || []) {
      const tickets = new Map<string, { name: string; price: number }>()
      for (const k of b.ticketsBySlot?.[t.id] || []) tickets.set(k.id, { name: k.name, price: k.price })
      const label = `${fmtDate(d.event_date)} ${String(t.start_time).slice(0, 5)}${v.is_virtual ? '' : ', ' + venueName(v)}`
      slots.set(`${venueName(v)}|${d.event_date}|${t.start_time}`, { id: t.id, label, tickets })
    }
  }
  return { venues, slots }
}

function diffTickets(c: EventChange[], a: Map<string, Slot>, b: Map<string, Slot>, stillAssigned: Set<string>) {
  for (const [k, os] of a) {
    const ns = b.get(k)
    if (!ns) continue
    for (const [id, ot] of os.tickets) {
      const nt = ns.tickets.get(id)
      if (!nt) { if (!stillAssigned.has(`${os.id}_${id}`)) c.push({ label: `Ticket (${os.label})`, note: 'Removed', detail: ot.name }); continue }
      if (ot.name !== nt.name) c.push({ label: `Ticket name (${os.label})`, from: ot.name, to: nt.name })
      if (ot.price !== nt.price) c.push({ label: `${nt.name} price (${os.label})`, from: `₹${ot.price}`, to: `₹${nt.price}` })
    }
    for (const [id, nt] of ns.tickets) if (!os.tickets.has(id)) c.push({ label: `Ticket (${os.label})`, note: 'Added', detail: `${nt.name} ₹${nt.price}` })
  }
}

export function diffEventBundle(oldB: any, newB: any, stillAssigned: Set<string>): EventChange[] {
  const c: EventChange[] = []
  const cat = (b: any) => [b.category_name, b.sub_category_name].filter(Boolean).join(' › ') || '—'
  short(c, 'Event name', oldB.name, newB.name)
  long(c, 'Description', oldB.description, newB.description)
  short(c, 'Category', cat(oldB), cat(newB))
  long(c, 'Terms & Conditions', oldB.terms_conditions, newB.terms_conditions)
  short(c, 'Min age', oldB.min_age, newB.min_age, x => (x ? `${x}+` : 'None'))
  short(c, 'Duration', oldB.event_duration_minutes, newB.event_duration_minutes, x => (x ? `${x} min` : '—'))
  short(c, 'Refunds', !!oldB.refund_allowed, !!newB.refund_allowed, x => (x ? 'Allowed' : 'Not allowed'))

  const a = flatten(oldB), b = flatten(newB)
  listed(c, 'Venue', 'Added', [...b.venues].filter(v => !a.venues.has(v)))
  listed(c, 'Venue', 'Removed', [...a.venues].filter(v => !b.venues.has(v)))
  listed(c, 'Session', 'Added', [...b.slots].filter(([k]) => !a.slots.has(k)).map(([, s]) => s.label))
  listed(c, 'Session', 'Removed', [...a.slots].filter(([k]) => !b.slots.has(k)).map(([, s]) => s.label))
  diffTickets(c, a.slots, b.slots, stillAssigned)

  for (const [label, key] of [['Banner', 'banners'], ['Gallery', 'gallery']] as const) {
    const o = ids(oldB[key]), n = ids(newB[key])
    const add = n.filter(i => !o.includes(i)).length, rem = o.filter(i => !n.includes(i)).length
    if (add || rem) c.push({ label, note: 'Changed', detail: [add && `${add} added`, rem && `${rem} removed`].filter(Boolean).join(', ') })
  }
  for (const [label, key] of [['Artists', 'artists'], ['Sponsors', 'sponsors']] as const) {
    const o = oldB[key] || [], n = newB[key] || []
    listed(c, label, 'Added', n.filter((x: any) => !ids(o).includes(x.id)).map((x: any) => x.name))
    listed(c, label, 'Removed', o.filter((x: any) => !ids(n).includes(x.id)).map((x: any) => x.name))
  }
  const ov = (oldB.video_links || []) as string[], nv = (newB.video_links || []) as string[]; listed(c, 'Video links', 'Added', nv.filter(u => !ov.includes(u))); listed(c, 'Video links', 'Removed', ov.filter(u => !nv.includes(u))); c.push(...diffBookingMethod(oldB.payment, newB.payment))
  return c
}
