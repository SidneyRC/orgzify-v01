// THIS FILE GOES IN: components/shared/OREV1-149-EventDecisionButtons.tsx (NEW file)
// Approve / Reject buttons for Admin, shown in the event header. Same actions as the Admin Events list.
'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import RejectReasonModal from '@/components/admin/OREV1-077-RejectReasonModal'
import type { EventDraft } from '@/components/shared/OREV1-100-EventRegistration'

const API = '/biz/events/api'

export default function OREV1149EventDecisionButtons({ event, theme, onDone }: { event: EventDraft; theme: any; onDone: () => void }) {
  const [busy, setBusy] = useState(false)
  const [rejecting, setRejecting] = useState(false)
  const radius = theme?.global_border_radius || '12px'
  const cls = 'text-sm font-medium px-5 py-2.5 hover:opacity-90 transition disabled:opacity-50'

  const decide = async (body: any, okMsg: string) => {
    setBusy(true)
    const res = await fetch(API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: event.id, ...body }) })
    const json = await res.json()
    setBusy(false)
    if (!res.ok) { toast.error(json.error || 'Action failed'); return }
    toast.success(okMsg); setRejecting(false); onDone()
  }

  return (
    <>
      <button onClick={() => decide({ action: 'approve' }, 'Event approved.')} disabled={busy} className={cls}
        style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }}>✓ Approve</button>
      <button onClick={() => setRejecting(true)} disabled={busy} className={cls}
        style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.badge_error_text || '#dc2626', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }}>✕ Reject</button>
      {rejecting && (
        <RejectReasonModal entityName={event.name} statusCode="rejected" apiBase={API}
          onCancel={() => setRejecting(false)}
          onConfirm={(reasonId, note) => decide({ action: 'reject', reason_id: reasonId, reason_note: note }, 'Event rejected.')} />
      )}
    </>
  )
}
