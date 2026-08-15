// THIS FILE GOES IN: components/shared/OREV1-114C-TicketAssignDates.tsx (NEW FILE)
'use client'

type Props = { venues: any[]; assignedIds: string[]; setAssignedIds: (ids: string[]) => void; locked: boolean; theme: any }

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

function BulkBtn({ onClick, label, locked, theme }: { onClick: () => void; label: string; locked: boolean; theme: any }) {
  return (
    <button type="button" disabled={locked} onClick={onClick} className="text-xs px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#374151', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}` }}>
      {label}
    </button>
  )
}

export default function OREV1114CTicketAssignDates({ venues, assignedIds, setAssignedIds, locked, theme }: Props) {
  const allSlots: { id: string; date: string }[] = []
  venues.forEach((v: any) => v.event_venue_dates?.forEach((d: any) => d.event_venue_times?.forEach((t: any) => allSlots.push({ id: t.id, date: d.event_date }))))

  const isChecked = (id: string) => assignedIds.includes(id)
  const toggle = (id: string) => setAssignedIds(isChecked(id) ? assignedIds.filter(x => x !== id) : [...assignedIds, id])
  const selectAll = () => setAssignedIds(allSlots.map(s => s.id))
  const selectWeekends = () => setAssignedIds(allSlots.filter(s => [0, 6].includes(new Date(s.date).getDay())).map(s => s.id))
  const selectWeekdays = () => setAssignedIds(allSlots.filter(s => ![0, 6].includes(new Date(s.date).getDay())).map(s => s.id))
  const clearAll = () => setAssignedIds([])

  return (
    <div>
      <p className="text-xs font-medium mb-2" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Assign to dates</p>
      <div className="flex gap-2 flex-wrap mb-3">
        <BulkBtn onClick={selectAll} label="All" locked={locked} theme={theme} />
        <BulkBtn onClick={clearAll} label="Selected" locked={locked} theme={theme} />
        <BulkBtn onClick={selectWeekends} label="Weekends" locked={locked} theme={theme} />
        <BulkBtn onClick={selectWeekdays} label="Weekdays" locked={locked} theme={theme} />
      </div>
      <div className="rounded-xl border border-gray-100 overflow-hidden">
        {venues.map((v: any, vi: number) => (
          <div key={v.id}>
            <div className="px-4 py-2 bg-gray-50" style={{ borderTop: vi > 0 ? '1px solid #f3f4f6' : undefined }}>
              <span className="text-xs font-semibold text-gray-600">{v.venues?.external_name || 'Venue'}</span>
            </div>
            <div className="px-4 py-3 flex flex-col gap-2">
              {v.event_venue_dates?.map((d: any) => d.event_venue_times?.map((t: any) => (
                <label key={t.id} className="flex items-center justify-between p-2 rounded-lg border border-gray-100 cursor-pointer">
                  <span className="text-xs text-gray-700">{formatDate(d.event_date)} &middot; {formatTime(t.start_time)}</span>
                  <input type="checkbox" disabled={locked} checked={isChecked(t.id)} onChange={() => toggle(t.id)} />
                </label>
              )))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
