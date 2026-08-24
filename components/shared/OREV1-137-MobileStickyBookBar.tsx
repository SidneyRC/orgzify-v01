// THIS FILE GOES IN: components/shared/OREV1-137-MobileStickyBookBar.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import OREV1127EventPaymentModal from '@/components/shared/OREV1-127-EventPaymentModal'

export default function OREV1137MobileStickyBookBar({ venues, ticketsBySlot, payment }: any) {
  const { theme } = useTheme()
  const [showPayment, setShowPayment] = useState(false)
  const allSlots = venues.flatMap((v: any) => v.dates.flatMap((d: any) => d.times.map((t: any) => t.id)))
  const firstSlotTickets = ticketsBySlot[allSlots[0]] || []
  const prices = firstSlotTickets.map((t: any) => t.price).filter((p: number) => p > 0)
  const lowest = prices.length > 0 ? Math.min(...prices) : 0

  return (
    <>
      <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 flex items-center justify-between px-4 py-4 gap-3" style={{ backgroundColor: theme?.color_surface || '#fff', borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb'), boxShadow: '0 -2px 10px rgba(0,0,0,0.06)' }}>
        <div className="min-w-0">
          <p className="text-2xl font-extrabold leading-tight whitespace-nowrap" style={{ color: theme?.color_text_primary || '#111827' }}>{lowest > 0 ? '₹' + lowest + ' onwards' : 'Free'}</p>
          <p className="text-sm whitespace-nowrap" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Per ticket</p>
        </div>
        <button onClick={() => setShowPayment(true)} className="px-7 py-3.5 text-base font-bold rounded-lg whitespace-nowrap shrink-0" style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff' }}>Book Now</button>
      </div>
      {showPayment && <OREV1127EventPaymentModal payment={payment} onClose={() => setShowPayment(false)} />}
    </>
  )
}