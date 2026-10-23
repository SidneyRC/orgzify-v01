// THIS FILE GOES IN: lib/buildEventShareMeta.ts (REPLACES existing file)
// One place that decides what is shared: the picture, the preview line under the
// title, and the message text. Used by the Share button AND the page preview tags.
// Pure functions only — safe to import from server and client files.

const BASE_URL = 'https://www.orgzify.com'
// Plain Orgzify picture, used only when an event has no image banner.
// Leave empty until the picture file is supplied; nothing breaks while empty.
const FALLBACK_IMAGE = ''

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', timeZone: 'UTC' })
const fmtTime = (t: string) => {
  const [h, m] = String(t || '').split(':')
  const hr = parseInt(h)
  if (isNaN(hr)) return ''
  return (hr % 12 === 0 ? 12 : hr % 12) + ':' + (m || '00') + ' ' + (hr >= 12 ? 'PM' : 'AM')
}

// Picture order: banner marked default (image) -> first image banner -> plain Orgzify picture.
export function pickShareImage(event: any): string {
  const banners = (event.banners || []).filter((b: any) => b.media_type === 'image')
  const marked = banners.find((b: any) => b.is_default_banner)
  return marked?.file_url || banners[0]?.file_url || FALLBACK_IMAGE
}

// Next upcoming session (date + start time); falls back to the earliest session.
function nextSession(event: any): { date: string; time: string } | null {
  let first: { date: string; time: string } | null = null
  for (const v of event.venues || []) for (const d of v.dates || []) for (const t of d.times || []) {
    const s = { date: d.event_date, time: t.start_time }
    if (t.id === event.nextUpcomingSlotId) return s
    if (!first || s.date + s.time < first.date + first.time) first = s
  }
  return first
}

export function buildEventShareMeta(event: any) {
  const s = nextSession(event)
  const date = s ? fmtDate(s.date) : ''
  const when = [date, s ? fmtTime(s.time) : ''].filter(Boolean).join(', ')
  const category = [event.category_name, event.sub_category_name].filter(Boolean).join(' • ')
  const link = BASE_URL + '/event/' + (event.process_id || event.slug)
  // bold = true adds the stars WhatsApp turns into bold; bold = false gives clean text for every other app.
  const compose = (bold: boolean) => {
    const b = (x: string) => (bold ? '*' + x + '*' : x)
    const lines = [
      b(event.name),
      when ? b('Date') + ' : ' + when : '',
      category ? b('Category') + ' : ' + category : '',
      event.organiser_name ? b('Organised') + ' by ' + event.organiser_name : '',
    ].filter(Boolean)
    return lines.join('\n') + '\n\n' + b('Reserve your Seat') + '\n' + link
  }
  return {
    link,
    image: pickShareImage(event),
    description: [event.organiser_name ? 'By ' + event.organiser_name : '', event.category_name, date].filter(Boolean).join(' · '),
    text: compose(true),
    plainText: compose(false),
  }
}
