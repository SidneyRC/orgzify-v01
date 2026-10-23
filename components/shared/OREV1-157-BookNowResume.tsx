// THIS FILE GOES IN: components/shared/OREV1-157-BookNowResume.tsx (REPLACES the file saved earlier today)
'use client'
import { useState, useEffect } from 'react'
import OREV1127EventPaymentModal from '@/components/shared/OREV1-127-EventPaymentModal'

// After login the visitor returns to the event with ?book=1&slot=<session>; the Book Now popup then opens by itself.
export default function OREV1157BookNowResume({ event, isLoggedIn }: { event: any; isLoggedIn: boolean }) {
  const [slot, setSlot] = useState<string | null>(null)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('book') !== '1') return
    window.history.replaceState({}, '', window.location.pathname)
    const id = params.get('slot') || ''
    const exists = (event.venues || []).some((v: any) => (v.dates || []).some((d: any) => (d.times || []).some((t: any) => t.id === id)))
    const status = event.slotStatusById?.[id]
    const tickets = event.ticketsBySlot?.[id] || []
    const soldOut = tickets.length > 0 && tickets.every((t: any) => t.soldOut)
    const closed = !event.published || !event.booking_open || !event.payment || event.noSessionsLeft || soldOut || (status && (status.status === 'past' || status.locked))
    if (isLoggedIn && exists && !closed) setSlot(id)
  }, [])

  if (slot === null) return null
  return <OREV1127EventPaymentModal event={event} payment={event.payment} selectedSlotId={slot} onClose={() => setSlot(null)} />
}
