'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1084TicketActivityList from '@/components/admin/OREV1-084-TicketActivityList'
import OREV1085TicketApprovalAction from '@/components/admin/OREV1-085-TicketApprovalAction'

type Ticket = { id: string; entity_id: string; category: string; sub_category: string; status: string; entity: { process_id: string; display_name: string } }
type Props = { ticket: Ticket; canOverwriteEdit?: boolean; onClose: () => void; onSaved: (newStatus: string) => void }

const STATUS_OPTIONS: Record<string, { code: string; label: string }[]> = {
  'New Submission': [{ code: 'New', label: 'New' }, { code: 'Pending', label: 'Pending' }, { code: 'Correction', label: 'Correction' }, { code: 'Resubmitted', label: 'Resubmitted' }, { code: 'Escalate', label: 'Escalate' }, { code: 'Closed', label: 'Closed' }],
  'Unmapped Reporting Office': [{ code: 'New', label: 'New' }, { code: 'Pending', label: 'Pending' }, { code: 'Escalate', label: 'Escalate' }, { code: 'Closed', label: 'Closed (Reporting Office already mapped)' }]
}

const UNMAPPED_CLOSE_DEFAULT = 'You may continue to fill your registration process. Your Region has been successfully mapped.'

export default function OREV1081TicketEditModal({ ticket, canOverwriteEdit = true, onClose, onSaved }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const [note, setNote] = useState('')
  const [visibleToEntity, setVisibleToEntity] = useState(false)
  const [status, setStatus] = useState(ticket.status)
  const [statusTouched, setStatusTouched] = useState(false)
  const [saving, setSaving] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  const options = STATUS_OPTIONS[ticket.sub_category] || STATUS_OPTIONS['New Submission']

  useEffect(() => {
    if (ticket.sub_category === 'Unmapped Reporting Office' && status === 'Closed' && !note) {
      setNote(UNMAPPED_CLOSE_DEFAULT)
    }
  }, [status])

  const handleSave = async () => {
    if (!note.trim() && !statusTouched) { toast.error('Add a note or change the status'); return }
    if (ticket.sub_category === 'Unmapped Reporting Office' && status === 'Closed' && !confirm('Confirm the Reporting Office has already been mapped elsewhere. Close this ticket?')) return
    setSaving(true)
    const res = await fetch('/admin/ecosystem/support/api', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: ticket.id, action: statusTouched ? 'change_status' : 'note', message: note.trim() || undefined, visible_to_entity: visibleToEntity, new_status: statusTouched ? status : undefined })
    })
    setSaving(false)
    if (!res.ok) { toast.error('Failed to save'); return }
    toast.success('Saved'); setNote(''); setStatusTouched(false); setRefreshKey(k => k + 1)
    onSaved(status)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <p className="text-sm font-semibold text-gray-700">{ticket.entity.display_name}</p>
            <p className="text-xs text-gray-400 font-mono">{ticket.entity.process_id}</p>
            <p className="text-xs text-gray-500 mt-1">{ticket.category} • {ticket.sub_category}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <button onClick={() => window.open(`/biz/register?ref=${ticket.entity.process_id}&mode=view&origin=support`, '_blank')} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 mb-4">Open Entity</button>

        <OREV1085TicketApprovalAction
          ticketId={ticket.id}
          entityId={ticket.entity_id}
          entityName={ticket.entity.display_name}
          subCategory={ticket.sub_category}
          onResult={(closed) => { setRefreshKey(k => k + 1); if (closed) onSaved('Closed') }}
        />

        <div className="flex flex-col gap-4 border-t border-gray-100 pt-4 mt-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Status</label>
            <select value={status} onChange={e => { setStatus(e.target.value); setStatusTouched(true) }} className="h-10 px-3 text-sm border border-gray-200 rounded-xl focus:outline-none">
              {options.map(o => <option key={o.code} value={o.code}>{o.label}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Add Note</label>
            <textarea value={note} onChange={e => setNote(e.target.value)} rows={3} placeholder="Type a note…" className="px-3 py-2 text-sm border border-gray-200 rounded-xl focus:outline-none" />
            <label className="flex items-center gap-2 text-xs text-gray-500 mt-1">
              <input type="checkbox" checked={visibleToEntity} onChange={e => setVisibleToEntity(e.target.checked)} className="w-4 h-4 accent-blue-900" />
              Visible to Entity
            </label>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-2 border-b border-gray-100 pb-4">
          <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Close</button>
          <button onClick={handleSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>
        </div>

        <div className="pt-4">
          <OREV1084TicketActivityList ticketId={ticket.id} isSuperAdmin={canOverwriteEdit} refreshKey={refreshKey} />
        </div>
      </div>
    </div>
  )
}
