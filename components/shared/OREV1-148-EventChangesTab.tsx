// THIS FILE GOES IN: components/shared/OREV1-148-EventChangesTab.tsx (NEW file)
'use client'
import { useEffect, useState } from 'react'
import type { EventChange } from '@/lib/diffEventBundle'

export default function OREV1148EventChangesTab({ eventId, theme }: { eventId: string; theme: any }) {
  const [changes, setChanges] = useState<EventChange[] | null>(null)
  const [error, setError] = useState('')
  const muted = theme?.color_text_muted || '#9ca3af'
  const primary = theme?.color_text_primary || '#111827'

  useEffect(() => {
    fetch(`/biz/events/changes/api?event_id=${eventId}`).then(r => r.json())
      .then(j => { if (j.error) setError(j.error); else setChanges(j.changes || []) })
      .catch(() => setError('Could not load the changes. Please try again.'))
  }, [eventId])

  if (error) return <p className="text-sm py-6 text-center" style={{ color: muted }}>{error}</p>
  if (!changes) return <p className="text-sm py-6 text-center" style={{ color: muted }}>Loading…</p>
  if (changes.length === 0) return <p className="text-sm py-6 text-center" style={{ color: muted }}>No changes found compared with the approved version.</p>

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      {changes.map((c, i) => (
        <div key={i} className="grid grid-cols-1 sm:grid-cols-[240px_1fr] gap-1 sm:gap-4 py-3 px-3 border-b border-gray-50 last:border-0 text-sm max-w-4xl">
          <span style={{ color: muted }}>{c.label}</span>
          <span className="break-words" style={{ color: primary }}>
            {c.from !== undefined && <><span className="line-through" style={{ color: muted }}>{c.from}</span> → {c.to}</>}
            {c.note && <span className="font-semibold" style={{ color: theme?.link_color || '#2563eb' }}>{c.note}</span>}
            {c.detail && <span>{c.note ? ' · ' : ''}{c.detail}</span>}
          </span>
        </div>
      ))}
    </div>
  )
}
