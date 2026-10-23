// THIS FILE GOES IN: components/shared/OREV1-137-MobileStickyBookBar.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import OREV1127EventPaymentModal from '@/components/shared/OREV1-127-EventPaymentModal'; 
import { handleBookTap } from '@/lib/bookNowActions'

export default function OREV1137MobileStickyBookBar({ event, payment, selectedSlotId, isLoggedIn }: any) {
  const { theme } = useTheme()
  const [showPayment, setShowPayment] = useState(false)
    const hasAnyPaymentMethod = !!payment && (payment.pg_enabled || payment.upi_enabled || payment.qr_enabled || payment.bank_enabled || payment.url_enabled)
  const slotStatus = event.slotStatusById?.[selectedSlotId]
  const slotLocked = !!slotStatus && (slotStatus.status === 'past' || slotStatus.locked)
  const slotTickets = event.ticketsBySlot?.[selectedSlotId] || []
  const slotSoldOut = slotTickets.length > 0 && slotTickets.every((t: any) => t.soldOut)
  const notPublished = !event.published || !hasAnyPaymentMethod
  const bookingDisabled = notPublished || !event.booking_open || slotLocked || slotSoldOut
  const disabledLabel = notPublished ? 'Not Published' : (!event.booking_open || slotLocked) ? 'Booking Closed' : 'Sold out'
  const isFast = slotTickets.some((t: any) => t.fastFilling && !t.soldOut) && !bookingDisabled
  const price = event.lowestActivePrice
  const priceLabel = price === 0 ? 'Free' : price != null ? '₹' + price + ' onwards' : '—'

  // No sessions left to book: the booking box already says "Booking closed", so no bar.
  if (event.noSessionsLeft) return null

  return (
    <>
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-between px-4 py-4 gap-3" style={{ backgroundColor: theme?.color_surface || '#fff', borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb'), boxShadow: '0 -2px 10px rgba(0,0,0,0.06)' }}>
        <div className="min-w-0">
          <p className="text-2xl font-extrabold leading-tight whitespace-nowrap" style={{ color: theme?.color_text_primary || '#111827' }}>{priceLabel}</p>
          <p className="text-sm whitespace-nowrap" style={isFast ? { color: theme?.badge_error_text || '#c0392b', fontWeight: 700 } : { color: theme?.color_text_muted || '#9ca3af' }}>{isFast ? 'Fast filling' : 'Per ticket'}</p>
        </div>
        <button onClick={() => !bookingDisabled && (handleBookTap(event, !!isLoggedIn, selectedSlotId) || setShowPayment(true))} disabled={bookingDisabled} className="px-7 py-3.5 text-base font-bold rounded-lg whitespace-nowrap shrink-0" style={bookingDisabled ? { backgroundColor: '#e5e7eb', color: '#9ca3af', cursor: 'not-allowed' } : { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff' }}>{bookingDisabled ? disabledLabel : 'Book Now'}</button>
      </div>
      {showPayment && !bookingDisabled && <OREV1127EventPaymentModal event={event} payment={payment} selectedSlotId={selectedSlotId} onClose={() => setShowPayment(false)} />}
    </>
  )
}
