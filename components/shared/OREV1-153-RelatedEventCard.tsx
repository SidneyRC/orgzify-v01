// THIS FILE GOES IN: components/shared/OREV1-153-RelatedEventCard.tsx (REPLACES existing file)
// One card in "You May Also Like". Interested row and Book Now row look like the booking box (OREV1-126).
// All colours come from the theme. Picture, name and Book Now open the event page in a new tab.
'use client'
import { useState } from 'react'
import { Calendar, MapPin, Video, Users } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import type { RelatedItem } from '@/lib/getRelatedEvents'

export default function OREV1153RelatedEventCard({ item, isLoggedIn }: { item: RelatedItem; isLoggedIn: boolean }) {
  const { theme } = useTheme()
  const [interested, setInterested] = useState(item.interested)
  const [count, setCount] = useState(item.interestedCount)
  const radius = theme?.global_border_radius || '12px'
  const link = theme?.link_color || '#2563eb'
  const strong = { color: theme?.color_text_primary || '#111827' }
  const secondary = { color: theme?.color_text_secondary || '#4b5563' }
  const muted = { color: theme?.color_text_muted || '#9ca3af' }
  const divider = { borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb') }
  const btn = { borderRadius: theme?.btn_border_radius || radius, height: '40px', minWidth: '100px' }
  const soldOutText = item.button === 'Sold out'
  const newTab = { target: '_blank', rel: 'noopener noreferrer' }

  const toggle = async () => {
    if (!isLoggedIn) { window.location.href = '/login?next=' + encodeURIComponent(item.href + '?registerInterest=1'); return }
    try {
      const res = await fetch('/event/event-interest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_id: item.id }) })
      const data = await res.json()
      if (!data.error) { setInterested(data.interested); setCount(data.count) }
    } catch {}
  }

  return (
    <div className="shrink-0 w-[260px] flex flex-col overflow-hidden" style={{ backgroundColor: theme?.color_surface || '#fff', border: '1px solid ' + (theme?.input_border || '#e5e7eb'), borderRadius: radius }}>
      <a href={item.href} {...newTab} className="block h-[130px] w-full" style={{ backgroundColor: theme?.avatar_bg || '#e5e7eb' }}>
        {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover" />}
      </a>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <span className="text-xs truncate" style={muted}>{item.category}</span>
        <a href={item.href} {...newTab} className="text-base font-semibold line-clamp-2 min-h-[3rem]" style={strong}>{item.name}</a>
        <p className="text-sm flex items-start gap-1.5" style={secondary}>
          <Calendar size={14} color={link} className="shrink-0 mt-1" />
          <span>{item.when}{item.moreDates > 0 && <span style={muted}> +{item.moreDates} more date{item.moreDates > 1 ? 's' : ''}</span>}</span>
        </p>
        <div className="text-sm flex items-start gap-1.5" style={secondary}>
          {item.isVirtual ? <Video size={14} color={link} className="shrink-0 mt-1" /> : <MapPin size={14} color={link} className="shrink-0 mt-1" />}
          <div className="min-w-0">
            <p className="truncate">{item.venue}</p>
            {item.venueSub && <p className="text-xs truncate" style={muted}>{item.venueSub}</p>}
          </div>
        </div>
        <div className="pt-3 mt-auto flex items-center justify-between gap-2" style={divider}>
          <span className="text-sm flex items-center gap-1.5" style={secondary}><Users size={16} color={theme?.color_text_muted || '#9ca3af'} />{count} interested</span>
          <button onClick={toggle} className="text-sm font-bold px-3 py-1.5 rounded-full shrink-0" style={{ backgroundColor: interested ? (theme?.badge_success_bg || '#eff6ff') : 'transparent', border: '2px solid ' + link, color: link }}>{interested ? '✓ Interested' : "I'm interested"}</button>
        </div>
        <div className="pt-3 flex items-center justify-between gap-2" style={divider}>
          <span className="text-base font-bold" style={item.price || !soldOutText ? strong : { color: theme?.badge_error_text || '#dc2626' }}>{item.price || (soldOutText ? 'Sold out' : '—')}</span>
          {item.button
            ? <span className="font-bold text-sm px-3 flex items-center justify-center whitespace-nowrap shrink-0" style={{ ...btn, backgroundColor: theme?.btn_disabled_bg || '#e5e7eb', color: muted.color, cursor: 'not-allowed' }}>{item.button}</span>
            : <a href={item.href} {...newTab} className="font-bold text-sm px-3 flex items-center justify-center shrink-0" style={{ ...btn, backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff' }}>Book Now</a>}
        </div>
      </div>
    </div>
  )
}
