// THIS FILE GOES IN: components/shared/OREV1-114H-TicketSlotGroups.tsx (REPLACE EXISTING)
'use client'
import OREV1114FTicketSlotRow from '@/components/shared/OREV1-114F-TicketSlotRow'

type Props = { venues: any[]; tickets: any[]; assignments: any[]; locked: boolean; onEdit: (ticket: any, assignment: any) => void; onDelete: (ticket: any, assignment: any) => void; onToggleEnabled: (assignment: any) => void; onToggleFastSelling: (assignment: any) => void; theme: any }

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}
function formatTime(t: string) {
  const [h, m] = t.split(':')
  const hour = parseInt(h, 10)
  const ampm = hour >= 12 ? 'PM' : 'AM'
  const h12 = hour % 12 === 0 ? 12 : hour % 12
  return `${h12}:${m} ${ampm}`
}

export default function OREV1114HTicketSlotGroups({ venues, tickets, assignments, locked, onEdit, onDelete, onToggleEnabled, onToggleFastSelling, theme }: Props) {
  const headText = { color: theme?.color_text_primary || '#111827' }
  const mutedText = { color: theme?.color_text_muted || '#9ca3af' }

  return (
    <div className="flex flex-col gap-3">
      {venues.map((v: any) => (v.event_venue_dates || []).flatMap((d: any) =>
        (d.event_venue_times || []).map((t: any) => {
          const slotAssignments = assignments.filter((a: any) => a.event_venue_time_id === t.id)
          return (
            <div key={t.id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              <div className="px-4 py-2 bg-gray-50">
                <span className="text-xs font-semibold" style={headText}>{v.venues?.external_name || 'Venue'} &middot; {formatDate(d.event_date)} &middot; {formatTime(t.start_time)}</span>
              </div>
              <div>
                {slotAssignments.length === 0 && <p className="text-xs px-4 py-3" style={mutedText}>⚠ No ticket assigned to this date/time</p>}
                {slotAssignments.map((a: any) => {
                  const ticket = tickets.find((tk: any) => tk.id === a.ticket_type_id)
                  if (!ticket) return null
                  return <OREV1114FTicketSlotRow key={a.id} ticket={ticket} assignment={a} locked={locked}
                    onEdit={() => onEdit(ticket, a)} onDelete={() => onDelete(ticket, a)}
                    onToggleEnabled={() => onToggleEnabled(a)} onToggleFastSelling={() => onToggleFastSelling(a)} theme={theme} />
                })}
              </div>
            </div>
          )
        })
      ))}
    </div>
  )
}
