// GOES IN: components/admin/OREV1-087-HelpDeskEditPanel.tsx
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import { allowedNextStatuses } from '@/lib/helpDeskStatusRules'

type Props = { currentStatus: string; statuses: any[]; saving: boolean; onCancel: () => void; onSave: (newStatus: string, followupDate: string, note: string, visibility: string) => void }

export default function OREV1087HelpDeskEditPanel({ currentStatus, statuses, saving, onCancel, onSave }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const allowedCodes = allowedNextStatuses(currentStatus)
  const options = statuses.filter((s: any) => allowedCodes.includes(s.code))
  const needsExplicitChoice = !allowedCodes.includes(currentStatus)
  const [newStatus, setNewStatus] = useState(needsExplicitChoice ? '' : currentStatus)
  const [followupDate, setFollowupDate] = useState('')
  const today = new Date().toISOString().split('T')[0]
  const [note, setNote] = useState('')
  const [visibility, setVisibility] = useState('external')

  return (
    <div className="flex flex-col gap-3 bg-gray-50 rounded-xl p-4">
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Status</label>
        <select value={newStatus} onChange={e => setNewStatus(e.target.value)} className="h-10 px-3 text-sm border border-gray-200 rounded-xl">
          {needsExplicitChoice && <option value="">Select new status…</option>}
          {options.map((s: any) => <option key={s.code} value={s.code}>{s.label}</option>)}
        </select>
      </div>
      {newStatus === 'pending' && (
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Next Follow-up Date</label>
          <input type="date" min={today} value={followupDate} onChange={e => setFollowupDate(e.target.value)} className="h-10 px-3 text-sm border border-gray-200 rounded-xl" />
        </div>
      )}
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">Add Note</label>
        <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} className="px-3 py-2 text-sm border border-gray-200 rounded-xl" />
        <label className="flex items-center gap-2 text-xs text-gray-500 mt-1">
          <input type="checkbox" checked={visibility === 'external'} onChange={e => setVisibility(e.target.checked ? 'external' : 'internal')} className="w-4 h-4" />
          Visible to Raiser
        </label>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} style={outlineBtn} className="text-sm font-medium px-4 py-2">Cancel</button>
        <button onClick={() => onSave(newStatus, followupDate, note, visibility)} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
      </div>
    </div>
  )
}
