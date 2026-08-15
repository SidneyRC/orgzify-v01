// THIS FILE GOES IN: components/shared/OREV1-112B-VenueDateTime.tsx (REPLACES existing file)
'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

const API = '/biz/events/eventvenue/schedule/api'
type TimeSlot = { id: string; start_time: string; end_time: string | null }
type DateRow = { id: string; event_date: string; event_venue_times: TimeSlot[] }
type Props = { eventVenueId: string; venueName: string; durationMinutes: number; locked: boolean }

function addMinutes(time: string, duration: number) {
  if (!duration) return null
  const [h, m] = time.split(':').map(Number)
  const total = (h * 60 + m + duration) % 1440
  return `${String(Math.floor(total / 60)).padStart(2, '0')}:${String(total % 60).padStart(2, '0')}`
}

const DeleteIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6" /><path d="M14 11v6" /><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
  </svg>
)

export default function OREV1112BVenueDateTime({ eventVenueId, venueName, durationMinutes, locked }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const today = new Date().toISOString().split('T')[0]

  const [dates, setDates] = useState<DateRow[]>([])
  const [newDate, setNewDate] = useState('')
  const [newStart, setNewStart] = useState('')

  const load = () => { fetch(`${API}?event_venue_id=${eventVenueId}`).then(r => r.json()).then(j => setDates(j.data || [])) }
  useEffect(() => { load() }, [eventVenueId])

  const addSession = async () => {
    if (!newDate || !newStart) return
    const end = addMinutes(newStart, durationMinutes)
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_session', event_venue_id: eventVenueId, event_date: newDate, start_time: newStart, end_time: end }) })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Session added')
    setNewDate(''); setNewStart(''); load()
  }

  const deleteDate = async (id: string) => {
    const res = await fetch(API, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'date', id }) })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Date removed')
    load()
  }
  const deleteTime = async (id: string) => {
    const res = await fetch(API, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'time', id }) })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Time removed')
    load()
  }

  return (
    <div className="border p-4" style={{ borderColor: theme?.input_border || '#e5e7eb', borderRadius: radius }}>
      <p className="text-sm font-semibold mb-3" style={{ color: theme?.color_text_primary || '#111827' }}>{venueName}</p>

      {dates.map(d => (
        <div key={d.id} className="mb-3 pb-3 border-b last:border-0" style={{ borderColor: theme?.input_border || '#f3f4f6' }}>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium" style={{ color: theme?.color_text_primary || '#111827' }}>{d.event_date}</span>
            {!locked && <button onClick={() => deleteDate(d.id)} title="Delete date" className="text-red-500 hover:opacity-70"><DeleteIcon /></button>}
          </div>
          {d.event_venue_times.map(t => (
            <div key={t.id} className="flex items-center gap-2 text-xs pl-1 py-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>
              <span>{t.start_time}</span>
              {!locked && <button onClick={() => deleteTime(t.id)} title="Delete time" className="text-red-500 hover:opacity-70"><DeleteIcon /></button>}
            </div>
          ))}
        </div>
      ))}

      {!locked && (
        <div className="flex flex-wrap gap-2 mt-2">
          <input type="date" min={today} value={newDate} onChange={e => setNewDate(e.target.value)} className="h-9 px-3 text-sm" style={inputStyle} />
          <input type="time" value={newStart} onChange={e => setNewStart(e.target.value)} className="h-9 px-3 text-sm" style={inputStyle} />
          <button onClick={addSession} style={outlineBtn} className="text-sm px-4">+ Add Session</button>
        </div>
      )}
    </div>
  )
}
