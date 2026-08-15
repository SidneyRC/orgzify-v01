// GOES IN: components/admin/OREV1-084-TicketDetailModal.tsx
'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1085HelpDeskActivityList from '@/components/admin/OREV1-085-HelpDeskActivityList'
import OREV1086HelpDeskAttachments from '@/components/admin/OREV1-086-HelpDeskAttachments'
import OREV1087HelpDeskEditPanel from '@/components/admin/OREV1-087-HelpDeskEditPanel'

type Props = { ticketId: string; canViewAuditTrail?: boolean; canOverwriteEdit?: boolean; onClose: () => void; onSaved: (ticketId: string) => void }
const OPEN_LABEL: Record<string, string> = { entity: 'Open Entity', staff: 'Open Staff Record', customer: 'Open Customer Profile' }

export default function OREV1084TicketDetailModal({ ticketId, canViewAuditTrail = false, canOverwriteEdit = true, onClose, onSaved }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [ticket, setTicket] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  const load = () => {
    fetch(`/admin/ecosystem/helpdesk/api/${ticketId}`).then(r => r.json()).then(j => {
      if (j.error) { toast.error(j.error); onClose(); return }
      setTicket(j.ticket); setActivity(j.activity || []); setAttachments(j.attachments || [])
    })
  }

  useEffect(() => {
    load()
    fetch('/admin/ecosystem/helpdesk/api/statuses').then(r => r.json()).then(j => setStatuses(j.data || []))
  }, [ticketId])

  const handleSave = async (newStatus: string, followupDate: string, note: string, visibility: string) => {
    if (newStatus === 'pending' && !followupDate) { toast.error('Follow-up Date required for Pending'); return }
    setSaving(true)
    const calls: Promise<Response>[] = []
    if (newStatus && newStatus !== ticket.status_code) {
      calls.push(fetch('/admin/ecosystem/helpdesk/api', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, action: 'change_status', new_status: newStatus, next_followup_date: followupDate || undefined })
      }))
    }
    if (note.trim()) {
      calls.push(fetch('/admin/ecosystem/helpdesk/api', {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticket_id: ticketId, action: 'add_note', message: note.trim(), visibility })
      }))
    }
    const results = await Promise.all(calls)
    const failed = results.find(r => !r.ok)
    if (failed) { const j = await failed.json(); toast.error(j.error); setSaving(false); return }
    setSaving(false)
    toast.success('Ticket updated'); onSaved(ticketId)
  }

  const handleResend = async (statusCode: string) => {
    const res = await fetch('/admin/ecosystem/helpdesk/api', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ticket_id: ticketId, action: 'resend_email', resend_status_code: statusCode }) })
    if (res.ok) { toast('Resend attempted — check Activity log below'); load() } else toast.error('Failed to resend')
  }

  if (!ticket) return null

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto shadow-xl">
        <div className="px-6 pt-6 pb-4 flex justify-between items-start border-b border-gray-100">
          <div>
            <p className="text-[11px] tracking-wide uppercase text-gray-400 font-medium">Editing · {ticket.ticket_number}</p>
            <p className="text-lg font-semibold mt-0.5" style={{ color: theme?.color_text_primary || '#111827' }}>{ticket.reference_label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{ticket.category_name} · {ticket.sub_category_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="flex gap-2 items-center flex-wrap">
            {ticket.open_url && <button onClick={() => window.open(ticket.open_url, '_blank')} style={outlineBtn} className="text-sm font-medium px-4 py-2">{OPEN_LABEL[ticket.reference_type] || 'Open Record'}</button>}
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-100">{ticket.status_label}</span>
          </div>

          <OREV1087HelpDeskEditPanel currentStatus={ticket.status_code} statuses={statuses} saving={saving} onCancel={onClose} onSave={handleSave} />

          <OREV1086HelpDeskAttachments ticketId={ticketId} attachments={attachments} canUpload={true} onChanged={load} />

          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: theme?.color_text_primary || '#111827' }}>Activity</p>
            <OREV1085HelpDeskActivityList activity={activity} showFullDetail={canViewAuditTrail} canResend={true} onResend={handleResend}
              canEditNotes={canOverwriteEdit} ticketId={ticketId} onNoteEdited={load} />
          </div>
        </div>
      </div>
    </div>
  )
}
