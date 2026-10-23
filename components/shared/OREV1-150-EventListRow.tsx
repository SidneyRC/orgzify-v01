// THIS FILE GOES IN: components/shared/OREV1-150-EventListRow.tsx (NEW FILE)
'use client'

export type EventRow = {
  id: string; process_id: string; name: string; slug: string; status: string
  published: boolean; booking_open: boolean; under_review: boolean; has_pending_edits: boolean; event_format: string
}

const STATUS_LABELS: Record<string, string> = { draft: 'Draft', pending: 'Pending', active: 'Active', rejected: 'Rejected' }
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500', pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700', rejected: 'bg-red-200 text-red-800'
}
const TAG = 'text-xs px-2.5 py-1 rounded-full font-medium'

export function EventListHeader({ theme, showBooking }: { theme: any; showBooking: boolean }) {
  return (
    <div className="hidden md:flex items-center gap-3 px-[17px] mb-2 text-xs font-medium" style={{ color: theme?.color_text_muted || '#9ca3af' }}>
      <span className="flex-1">Event</span><span className="w-56">Status</span><span className="w-24">{showBooking ? 'Booking' : ''}</span><span className="w-8" />
    </div>
  )
}

type Props = { ev: EventRow; theme: any; onOpen: () => void; onToggle: (ev: EventRow, e: React.MouseEvent) => void; onDelete: (ev: EventRow, e: React.MouseEvent) => void }

export default function OREV1150EventListRow({ ev, theme, onOpen, onToggle, onDelete }: Props) {
  const muted = { color: theme?.color_text_muted || '#9ca3af' }
  const isActive = ev.status === 'active'

  const tags = (
    <>
      <span className={`${TAG} ${STATUS_COLORS[ev.status] || 'bg-gray-100 text-gray-500'}`}>{STATUS_LABELS[ev.status] || ev.status}</span>
      {isActive && ev.has_pending_edits && !ev.under_review && <span className={`${TAG} bg-orange-100 text-orange-600`}>Correction</span>}
      {ev.under_review && <span className={`${TAG} bg-blue-100 text-blue-600`}>In Review</span>}
    </>
  )

  const toggle = isActive && (
    <button onClick={e => onToggle(ev, e)} title={ev.booking_open ? 'Turn booking off' : 'Turn booking on'}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0"
      style={{ backgroundColor: ev.booking_open ? '#22c55e' : (theme?.btn_disabled_bg || '#e5e7eb') }}>
      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${ev.booking_open ? 'translate-x-6' : 'translate-x-1'}`} />
    </button>
  )

  const bin = (ev.status === 'draft' || ev.status === 'pending') && (
    <button onClick={e => onDelete(ev, e)} title="Delete" className="text-red-400 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50">
      <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
    </button>
  )

  return (
    <div onClick={onOpen} className="bg-white rounded-2xl border border-gray-100 p-4 cursor-pointer hover:shadow-sm transition">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-gray-800 truncate">{ev.name}</p>
          <p className="text-xs text-gray-400 mt-0.5">{ev.process_id} · {ev.event_format}</p>
        </div>
        <div className="hidden md:flex w-56 items-center gap-2 flex-wrap">{tags}</div>
        <div className="hidden md:flex w-24 items-center">{toggle}</div>
        <div className="w-8 flex justify-end">{bin}</div>
      </div>
      <div className="md:hidden mt-3 pt-3 flex flex-col gap-2 text-sm" style={{ borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb') }}>
        <div className="flex items-start justify-between gap-3"><span style={muted}>Status</span><span className="flex items-center gap-2 flex-wrap justify-end">{tags}</span></div>
        {isActive && <div className="flex items-center justify-between"><span style={muted}>Booking</span>{toggle}</div>}
      </div>
    </div>
  )
}
