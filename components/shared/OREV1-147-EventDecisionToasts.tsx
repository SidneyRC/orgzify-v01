// THIS FILE GOES IN: components/shared/OREV1-147-EventDecisionToasts.tsx (NEW FILE)
'use client'
import { useEffect } from 'react'
import toast from 'react-hot-toast'

type Row = { id: string; name: string; status: string; approved_at: string | null; rejected_at: string | null; reason: string | null }

// One-time messages when Admin approved / rejected an event since the organiser's last visit (this browser).
export default function OREV1147EventDecisionToasts({ entityId }: { entityId: string }) {
  useEffect(() => {
    fetch(`/biz/events/decisions/api?entity_id=${entityId}`).then(r => r.json()).then(j => {
      if (!j.data) return
      const rows: Row[] = j.data
      const key = `event_seen_${entityId}`
      try {
        const prev = JSON.parse(localStorage.getItem(key) || 'null')
        const next: Record<string, any> = {}
        rows.forEach(r => {
          next[r.id] = { s: r.status, a: r.approved_at, rj: r.rejected_at }
          const p = prev?.[r.id]
          if (!p) return
          const why = r.reason ? `: ${r.reason}` : ''
          const opt = { id: `ev_${r.id}_${r.status}_${r.approved_at}_${r.rejected_at}` }
          if (r.status === 'active' && p.s !== 'active') toast.success(`Your event "${r.name}" is approved`, opt)
          else if (r.status === 'rejected' && (p.s !== 'rejected' || r.rejected_at !== p.rj)) toast.error(`Your event "${r.name}" was not approved${why}`, opt)
          else if (r.status === 'active' && r.approved_at !== p.a) toast.success(`Changes to "${r.name}" are approved`, opt)
          else if (r.status === 'active' && r.rejected_at && r.rejected_at !== p.rj) toast.error(`Changes to "${r.name}" were not approved${why}`, opt)
        })
        localStorage.setItem(key, JSON.stringify(next))
      } catch {}
    }).catch(() => {})
  }, [entityId])
  return null
}