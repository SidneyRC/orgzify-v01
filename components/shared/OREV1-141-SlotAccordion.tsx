// THIS FILE GOES IN: components/shared/OREV1-141-SlotAccordion.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'

const Icon = ({ d, color }: { d: string; color: string }) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d={d} /></svg>
const PIN_D = 'M12 22s7-7.5 7-12a7 7 0 10-14 0c0 4.5 7 12 7 12zM12 13a3 3 0 100-6 3 3 0 000 6z'
const CHEVRON_D = 'M6 9l6 6 6-6'

export default function OREV1141SlotAccordion({ theme, allSlots, upcomingSlotIds, slotStatusById, ticketsBySlot, selectedSlotId, onSelectSlot }: any) {
  const initial = upcomingSlotIds.find((id: string) => !slotStatusById?.[id]?.locked) || upcomingSlotIds[0] || allSlots[0]?.id || ''
  const [expandedId, setExpandedId] = useState<string>(initial)

  const strong = { color: theme?.color_text_primary || '#111827' }
  const muted = { color: theme?.color_text_muted || '#9ca3af' }
  const errStyle = { color: theme?.badge_error_text || '#c0392b' }
  const iconColor = theme?.link_color || '#2563eb'
  const dividerColor = theme?.divider_color || '#e5e7eb'
  const radius = theme?.global_border_radius || '12px'
  const liveColor = theme?.color_success || '#16a34a'

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  const fmtTime = (t: string) => { const parts = t.split(':'); const hr = parseInt(parts[0]); const ap = hr >= 12 ? 'PM' : 'AM'; const h12 = hr % 12 === 0 ? 12 : hr % 12; return h12 + ':' + parts[1] + ' ' + ap }
  // No real address for a virtual venue — so no map link for it either.
  const isVirtualVenue = (v: any) => !!v?.is_virtual
  const mapUrl = (v: any) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent([v.external_name, v.line1, v.area].filter(Boolean).join(', '))

  const upcoming = allSlots.filter((s: any) => upcomingSlotIds.includes(s.id))
  const singleSlot = allSlots.length === 1

  const toggleSlot = (id: string) => {
    const status = slotStatusById?.[id]
    if (status?.locked) return
    const next = expandedId === id ? '' : id
    setExpandedId(next)
    onSelectSlot(next || id)
  }

  const isFast = (id: string) => (ticketsBySlot[id] || []).some((t: any) => t.fastFilling && !t.soldOut)
  const isSoldOut = (id: string) => (ticketsBySlot[id] || []).length > 0 && (ticketsBySlot[id] || []).every((t: any) => t.soldOut)
  const statusTag = (id: string) => {
    const s = slotStatusById?.[id]
    if (!s || s.status !== 'live') return null
    return s.locked ? 'Live now · Booking closed' : 'Live now'
  }

  return (
    <div className="flex flex-col gap-2">
      {upcoming.map((s: any) => {
        const isOpen = expandedId === s.id
        const locked = !!slotStatusById?.[s.id]?.locked
        const tag = statusTag(s.id)
        const tickets = ticketsBySlot[s.id] || []
        return (
          <div key={s.id} style={{ border: '1px solid ' + (isOpen ? iconColor : dividerColor), borderRadius: radius, padding: '10px 14px', opacity: locked ? 0.6 : 1 }}>
            <button onClick={() => toggleSlot(s.id)} disabled={locked || singleSlot} className="w-full flex items-center justify-between text-left">
              <div>
                <div className="text-base font-medium" style={strong}>{s.venue.external_name}</div>{!isVirtualVenue(s.venue) && [s.venue.area, s.venue.city_name].filter(Boolean).length > 0 && <div className="text-sm flex items-center gap-1.5 flex-wrap" style={muted}><span>{[s.venue.area, s.venue.city_name].filter(Boolean).join(', ')}</span><a href={mapUrl(s.venue)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}><Icon d={PIN_D} color={iconColor} /></a></div>}
                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                  <span className="text-base" style={muted}>{fmtDate(s.date)} · {fmtTime(s.time)}</span>
                  {!isVirtualVenue(s.venue) && [s.venue.area, s.venue.city_name].filter(Boolean).length === 0 && <a href={mapUrl(s.venue)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}><Icon d={PIN_D} color={iconColor} /></a>}
                  {tag && <span className="text-xs font-semibold" style={{ color: locked ? muted.color : liveColor }}>{tag}</span>}
                  {isFast(s.id) && !locked && <span className={'text-sm font-bold' + (singleSlot ? ' hidden lg:inline' : '')} style={errStyle}>Fast filling</span>}
                  {isSoldOut(s.id) && !locked && <span className="text-sm font-bold" style={errStyle}>Sold out</span>}
                </div>
              </div>
              {!singleSlot && !locked && <span style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><Icon d={CHEVRON_D} color={muted.color} /></span>}
            </button>
            {isOpen && !locked && (
              <div className="mt-3 pt-3 flex flex-col gap-2" style={{ borderTop: '1px solid ' + dividerColor }}>
                {tickets.map((t: any) => (
                  <div key={t.id} className="flex justify-between text-base">
                    <span style={{ color: theme?.color_text_secondary || '#4b5563' }}>{t.name}</span>
                    <span className="font-bold" style={t.soldOut ? errStyle : strong}>{t.soldOut ? 'Sold out' : t.price === 0 ? 'Free' : '₹' + t.price}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
