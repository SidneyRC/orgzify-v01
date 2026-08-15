// GOES IN: components/admin/OREV1-098-VenueReviewModal.tsx
'use client'
import { useTheme } from '@/lib/ThemeContext'

type Reason = { id: string; reason_label: string }

type Props = {
  action: 'reject' | 'suspend' | 'block'
  reasons: Reason[]
  reasonId: string
  reasonNote: string
  onReasonIdChange: (id: string) => void
  onReasonNoteChange: (note: string) => void
  onCancel: () => void
  onSubmit: () => void
}

export default function OREV1098VenueReviewModal({ action, reasons, reasonId, reasonNote, onReasonIdChange, onReasonNoteChange, onCancel, onSubmit }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const selectClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-sm w-full flex flex-col gap-3">
        <p className="text-sm font-semibold capitalize">{action} Venue</p>
        {reasons.length > 0 && (
          <select value={reasonId} onChange={e => onReasonIdChange(e.target.value)} className={selectClass}>
            <option value="">Select a reason…</option>
            {reasons.map(rr => <option key={rr.id} value={rr.id}>{rr.reason_label}</option>)}
          </select>
        )}
        <textarea value={reasonNote} onChange={e => onReasonNoteChange(e.target.value)} placeholder="Additional note (optional if a reason is selected)"
          className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none" rows={3} />
        <div className="flex justify-end gap-2 pt-1">
          <button onClick={onCancel} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Cancel</button>
          <button onClick={onSubmit} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Submit</button>
        </div>
      </div>
    </div>
  )
}
