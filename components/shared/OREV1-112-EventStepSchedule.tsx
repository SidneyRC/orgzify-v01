// THIS FILE GOES IN: components/shared/OREV1-112-EventStepSchedule.tsx (REPLACES existing file)
'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import OREV1112BVenueDateTime from '@/components/shared/OREV1-112B-VenueDateTime'

const VENUE_API = '/biz/events/eventvenue/api'
const SCHEDULE_API = '/biz/events/eventvenue/schedule/api'
type EventVenue = { id: string; venue_id: string; venue: { external_name: string } | null }
type Props = { eventId: string; eventFormat: string; durationMinutes: number; locked: boolean; onContinue: () => void; onBack: () => void; onClose: () => void }

export default function OREV1112EventStepSchedule({ eventId, eventFormat, durationMinutes, locked, onContinue, onBack, onClose }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [eventVenues, setEventVenues] = useState<EventVenue[]>([])
  const [loading, setLoading] = useState(true)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const init = async () => {
      if (eventFormat === 'virtual') {
        await fetch(VENUE_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'ensure_virtual', event_id: eventId }) })
      }
      const res = await fetch(`${VENUE_API}?event_id=${eventId}`)
      const json = await res.json()
      setEventVenues(json.selected || [])
      setLoading(false)
    }
    init()
  }, [eventId, eventFormat])

  const handleContinue = async () => {
    setChecking(true); setError('')
    const results = await Promise.all(eventVenues.map(ev => fetch(`${SCHEDULE_API}?event_venue_id=${ev.id}`).then(r => r.json())))
    const anyEmpty = results.some(json => (json.data || []).reduce((sum: number, d: any) => sum + d.event_venue_times.length, 0) === 0)
    if (anyEmpty) { setError('Every venue needs at least one date/time session before you can continue.'); setChecking(false); return }
    setChecking(false)
    onContinue()
  }

  if (loading) return <p className="text-sm text-gray-400">Loading schedule…</p>

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {locked && <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700">This event is awaiting Admin review and can't be edited right now.</div>}
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: theme?.color_text_primary || '#111827' }}>Date &amp; Time</h2>
        <p className="text-sm" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Add one or more date/time sessions for each venue.</p>
      </div>

      <div className="flex flex-col gap-4">
        {eventVenues.map(ev => (
          <OREV1112BVenueDateTime
            key={ev.id}
            eventVenueId={ev.id}
            venueName={eventFormat === 'virtual' ? 'Virtual Event' : (ev.venue?.external_name || 'Venue')}
            durationMinutes={durationMinutes}
            locked={locked}
          />
        ))}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}

      <div className="flex justify-end gap-2">
        <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">← Back</button>
        <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">✕ Close</button>
        {!locked && <button onClick={handleContinue} disabled={checking} style={primaryBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition disabled:opacity-50">{checking ? 'Checking…' : 'Continue'}</button>}
      </div>
    </div>
  )
}
