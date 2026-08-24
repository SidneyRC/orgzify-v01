// THIS FILE GOES IN: components/shared/OREV1-126-EventBookingBox.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import OREV1127EventPaymentModal from '@/components/shared/OREV1-127-EventPaymentModal'

const Icon = ({ d, color }: { d: string; color: string }) => <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2"><path d={d} /></svg>
const ICONS = {
  category: 'M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4zM14 14h6v6h-6z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  age: 'M12 12a4 4 0 100-8 4 4 0 000 8zM4 20a8 8 0 0116 0',
  lang: 'M12 22a10 10 0 100-20 10 10 0 000 20zM2 12h20M12 2a15 15 0 010 20 15 15 0 010-20z',
  pin: 'M12 22s7-7.5 7-12a7 7 0 10-14 0c0 4.5 7 12 7 12zM12 13a3 3 0 100-6 3 3 0 000 6z',
  users: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
}

export default function OREV1126EventBookingBox({ event, venues, ticketsBySlot, payment, selectedSlotId, onSelectSlot, hideBookButton }: any) {
  const { theme } = useTheme()
  const [showPayment, setShowPayment] = useState(false)
  const [interested, setInterested] = useState(false)
  const [count, setCount] = useState(event.interested_count || 0)
  const radius = theme?.global_border_radius || '12px'
  const iconColor = theme?.link_color || '#2563eb'
  const strong = { color: theme?.color_text_primary || '#111827' }
  const secondary = { color: theme?.color_text_secondary || '#4b5563' }
  const muted = { color: theme?.color_text_muted || '#9ca3af' }
  const dividerColor = theme?.divider_color || '#e5e7eb'
  const divider = { borderTop: '1px solid ' + dividerColor }
  const cardBorder = '1px solid ' + (theme?.input_border || '#e5e7eb')

  const allSlots = venues.flatMap((v: any) => v.dates.flatMap((d: any) => d.times.map((t: any) => ({ id: t.id, venue: v, date: d.event_date, time: t.start_time }))))
  const carousel = allSlots.length > 3
  const tickets = ticketsBySlot[selectedSlotId] || ticketsBySlot[allSlots[0]?.id] || []
  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
  const fmtTime = (t: string) => { const parts = t.split(':'); const hr = parseInt(parts[0]); const ap = hr >= 12 ? 'PM' : 'AM'; const h12 = hr % 12 === 0 ? 12 : hr % 12; return h12 + ':' + parts[1] + ' ' + ap }
  const mapUrl = (v: any) => 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(v.external_name + ', ' + v.city_name)

  const totalMin = event.event_duration_minutes || 0
  const hrs = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  const durationLabel = hrs > 0 ? (mins > 0 ? `${hrs} hr ${mins} min` : `${hrs} hr`) : `${mins} min`

  const slotListClass = carousel ? 'pt-3 flex gap-3 overflow-x-auto snap-x' : 'pt-3 flex gap-3 flex-col'
  const slotBtnClass = carousel ? 'text-left shrink-0 w-48 snap-start' : 'text-left'

  const toggleInterested = () => { setInterested(!interested); setCount((c: number) => interested ? c - 1 : c + 1) }

  const hasAnyPaymentMethod = !!payment && (payment.pg_enabled || payment.upi_enabled || payment.qr_enabled || payment.bank_enabled || payment.url_enabled)
  const bookingDisabled = !event.published || !hasAnyPaymentMethod

  return (
    <div className="lg:sticky lg:top-20 h-fit p-4 flex flex-col gap-3" style={{ backgroundColor: theme?.color_surface || '#fff', border: cardBorder, borderRadius: radius }}>
      <div className="flex flex-col gap-3 text-base">
        <div className="flex items-center gap-2.5"><Icon d={ICONS.category} color={iconColor} /><span className="font-semibold" style={strong}>{[event.category_name, event.sub_category_name].filter(Boolean).join(' • ')}</span></div>
        <div className="flex items-center gap-2.5"><Icon d={ICONS.clock} color={iconColor} /><span className="font-semibold" style={strong}>{durationLabel}</span></div>
        <div className="flex items-center gap-2.5"><Icon d={ICONS.age} color={iconColor} /><span className="font-semibold" style={strong}>Age Limit - {event.min_age}yrs +</span></div>
        <div className="flex items-center gap-2.5"><Icon d={ICONS.lang} color={iconColor} /><span className="font-semibold" style={strong}>{(event.languages || []).join(', ')}</span></div>
      </div>

      <div className={slotListClass} style={divider}>
        {allSlots.map((s: any) => (
          <button key={s.id} onClick={() => onSelectSlot(s.id)} className={slotBtnClass} style={{ opacity: selectedSlotId === s.id || !selectedSlotId ? 1 : 0.7 }}>
            <div className="flex items-center justify-between gap-2">
              <span className="text-base font-bold" style={strong}>{s.venue.external_name}</span>
              <a href={mapUrl(s.venue)} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()}><Icon d={ICONS.pin} color={iconColor} /></a>
            </div>
            <span className="text-sm" style={muted}>{fmtDate(s.date)} · {fmtTime(s.time)}</span>
          </button>
        ))}
      </div>

      <div className="pt-3 flex flex-col gap-2" style={divider}>
        {tickets.map((t: any) => (
          <div key={t.id} className="flex justify-between text-base">
            <span style={secondary}>{t.name}</span>
            <span className="font-bold text-lg" style={strong}>{t.price === 0 ? 'Free' : '₹' + t.price}</span>
          </div>
        ))}
      </div>

      <div className="pt-3 flex justify-between items-center" style={divider}>
        <span className="text-sm flex items-center gap-1.5" style={secondary}><Icon d={ICONS.users} color={theme?.color_text_muted || '#9ca3af'} />{count} interested</span>
        <button onClick={toggleInterested} className="text-base font-bold px-4 py-2.5 rounded-full" style={{ backgroundColor: interested ? (theme?.badge_success_bg || '#eff6ff') : 'transparent', border: '2px solid ' + (theme?.link_color || '#2563eb'), color: theme?.link_color || '#2563eb' }}>{interested ? '✓ Interested' : "I'm interested"}</button>
      </div>

      {!hideBookButton && (
        <button onClick={() => !bookingDisabled && setShowPayment(true)} disabled={bookingDisabled}
          className="w-full py-3.5 text-lg font-bold transition"
          style={bookingDisabled
            ? { backgroundColor: '#e5e7eb', color: '#9ca3af', borderRadius: theme?.btn_border_radius || radius, cursor: 'not-allowed' }
            : { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: theme?.btn_border_radius || radius }}>
          {bookingDisabled ? 'Booking not open yet' : 'Book Now'}
        </button>
      )}

      {showPayment && !bookingDisabled && <OREV1127EventPaymentModal payment={payment} onClose={() => setShowPayment(false)} />}
    </div>
  )
}
