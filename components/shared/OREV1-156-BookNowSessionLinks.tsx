// THIS FILE GOES IN: components/shared/OREV1-156-BookNowSessionLinks.tsx (REPLACES the file saved earlier today)
'use client'
import { openSessionLinks, safeUrl, goUrl } from '@/lib/bookNowActions'

const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
const fmtTime = (t: string) => { const p = t.split(':'); const hr = parseInt(p[0]); const h12 = hr % 12 === 0 ? 12 : hr % 12; return h12 + ':' + p[1] + ' ' + (hr >= 12 ? 'PM' : 'AM') }

// Booking link screen of the Book Now popup: one Continue button, or one Go button per session.
// Every button goes through the Orgzify forwarding address, so the Processing ID records where the visitor was sent.
export default function OREV1156BookNowSessionLinks({ event, theme, pid, slotId }: { event: any; theme: any; pid: string; slotId: string }) {
  const radius = theme?.global_border_radius || '12px'
  const primary = { color: theme?.color_text_primary || '#111827' }
  const muted = { color: theme?.color_text_muted || '#9ca3af' }
  const btn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const perSession = event?.payment?.url_mode === 'per_slot'
  const links = perSession ? openSessionLinks(event) : []
  const hasSingle = !!safeUrl(event?.payment?.external_url)

  if (!perSession) {
    return hasSingle
      ? <div className="flex flex-col gap-3 mt-2"><p className="text-lg font-semibold" style={primary}>Continue to booking</p><a href={goUrl(event.id, slotId, pid)} target="_blank" rel="noopener noreferrer" className="w-full text-center py-2.5 text-base font-semibold" style={btn}>Continue</a></div>
      : <p className="text-base mt-4 text-center" style={muted}>The booking link isn't available yet.</p>
  }
  if (links.length === 0) return <p className="text-base mt-4 text-center" style={muted}>No booking links are open right now.</p>
  return (
    <div className="flex flex-col mt-2">
      <p className="text-lg font-semibold mb-2" style={primary}>Choose your session</p>
      {links.map(l => (
        <div key={l.id} className="flex items-center justify-between gap-3 py-2" style={{ borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb') }}>
          <div className="min-w-0">
            <p className="text-base font-semibold" style={primary}>{l.venue}</p>
            <p className="text-sm" style={muted}>{fmtDate(l.date)}, {fmtTime(l.time)}</p>
          </div>
          <a href={goUrl(event.id, l.id, pid)} target="_blank" rel="noopener noreferrer" className="text-base font-semibold px-5 py-2 shrink-0" style={btn}>Go</a>
        </div>
      ))}
    </div>
  )
}
