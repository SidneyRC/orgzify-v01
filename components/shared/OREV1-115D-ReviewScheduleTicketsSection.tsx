// THIS FILE GOES IN: components/shared/OREV1-115D-ReviewScheduleTicketsSection.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
import OREV1115AReviewSectionHeader from '@/components/shared/OREV1-115A-ReviewSectionHeader'

type Props = { eventId: string; onEdit: () => void; theme: any }

function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
function fmtTime(t: string) { const [h, m] = t.split(':'); const hr = parseInt(h, 10); const ap = hr >= 12 ? 'PM' : 'AM'; return `${hr % 12 === 0 ? 12 : hr % 12}:${m} ${ap}` }

export default function OREV1115DReviewScheduleTicketsSection({ eventId, onEdit, theme }: Props) {
  const [venues, setVenues] = useState<any[]>([])
  const [tickets, setTickets] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  useEffect(() => {
    fetch(`/biz/events/eventvenue/tickets/api?event_id=${eventId}`).then(r => r.json())
      .then(j => { setVenues(j.venues || []); setTickets(j.tickets || []); setAssignments(j.assignments || []) })
  }, [eventId])
  const headText = { color: theme?.color_text_primary || '#111827' }
  const mutedText = { color: theme?.color_text_muted || '#9ca3af' }
  const hasSlots = venues.some((v: any) => (v.event_venue_dates || []).some((d: any) => (d.event_venue_times || []).length > 0))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <OREV1115AReviewSectionHeader title="Schedule & Tickets" onEdit={onEdit} theme={theme} />
      <div className="p-3 flex flex-col gap-2">
        {!hasSlots && <p className="text-xs text-red-500">⚠ No venue/schedule added yet</p>}
        {venues.map((v: any) => (v.event_venue_dates || []).flatMap((d: any) =>
          (d.event_venue_times || []).map((t: any) => {
            const rows = assignments.filter((a: any) => a.event_venue_time_id === t.id)
            return (
              <div key={t.id} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-3 py-1.5 bg-gray-50">
                  <span className="text-xs font-semibold" style={headText}>{v.venues?.external_name || 'Venue'} · {fmtDate(d.event_date)} · {fmtTime(t.start_time)}</span>
                </div>
                {rows.length === 0 && <p className="text-xs px-3 py-2" style={mutedText}>⚠ No ticket assigned</p>}
                {rows.map((a: any) => {
                  const ticket = tickets.find((tk: any) => tk.id === a.ticket_type_id)
                  if (!ticket) return null
                  const price = ticket.ticket_type === 'free' ? 'Free' : `₹${a.price}`
                  return <p key={a.id} className="text-xs px-3 py-1.5" style={headText}>{ticket.name} · {price} · {a.sold_count || 0}/{a.quantity} sold</p>
                })}
              </div>
            )
          })
        ))}
      </div>
    </div>
  )
}