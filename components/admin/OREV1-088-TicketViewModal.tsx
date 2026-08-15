// GOES IN: components/admin/OREV1-088-TicketViewModal.tsx
'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1085HelpDeskActivityList from '@/components/admin/OREV1-085-HelpDeskActivityList'

type Props = { ticketId: string; canViewAuditTrail?: boolean; canEdit?: boolean; canOverwriteEdit?: boolean; onClose: () => void; onEdit: () => void; onReopen?: () => void }
const OPEN_LABEL: Record<string, string> = { entity: 'Open Entity', staff: 'Open Staff Record', customer: 'Open Customer Profile' }

export default function OREV1088TicketViewModal({ ticketId, canViewAuditTrail = false, canEdit = true, canOverwriteEdit = true, onClose, onEdit, onReopen }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }

  const [ticket, setTicket] = useState<any>(null)
  const [activity, setActivity] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>([])

  const load = () => {
    fetch(`/admin/ecosystem/helpdesk/api/${ticketId}`).then(r => r.json()).then(j => {
      if (j.error) { toast.error(j.error); onClose(); return }
      setTicket(j.ticket); setActivity(j.activity || []); setAttachments(j.attachments || [])
    })
  }

  useEffect(() => { load() }, [ticketId])

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
            <p className="text-[11px] tracking-wide uppercase text-gray-400 font-medium">{ticket.ticket_number}</p>
            <p className="text-lg font-semibold mt-0.5" style={{ color: theme?.color_text_primary || '#111827' }}>{ticket.reference_label}</p>
            <p className="text-xs text-gray-500 mt-0.5">{ticket.category_name} · {ticket.sub_category_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-300 hover:text-gray-600 text-lg leading-none">✕</button>
        </div>

        <div className="px-6 py-4 flex flex-col gap-4">
          <div className="flex gap-2 items-center flex-wrap">
            {ticket.open_url && <button onClick={() => window.open(ticket.open_url, '_blank')} style={outlineBtn} className="text-sm font-medium px-4 py-2">{OPEN_LABEL[ticket.reference_type] || 'Open Record'}</button>}
            <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-50 text-blue-700 border border-blue-100">{ticket.status_label}</span>
            {ticket.status_code === 'closed'
              ? (canEdit && onReopen && <button onClick={onReopen} style={primaryBtn} className="text-sm font-medium px-4 py-2 ml-auto">Reopen</button>)
              : (canEdit && <button onClick={onEdit} style={primaryBtn} className="text-sm font-medium px-4 py-2 ml-auto">Edit</button>)}
          </div>

          {attachments.length > 0 && (
            <div className="flex flex-col gap-2">
              <label className="text-xs text-gray-500">Attachments</label>
              <div className="grid grid-cols-3 gap-2">
                {attachments.map((a: any) => (
                  <a key={a.id} href={a.file_url} target="_blank" rel="noreferrer">
                    <img src={a.file_url} alt={a.file_name} className="w-full h-20 object-cover rounded-xl border border-gray-100" />
                  </a>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold mb-3" style={{ color: theme?.color_text_primary || '#111827' }}>Activity</p>
            <OREV1085HelpDeskActivityList activity={activity} showFullDetail={canViewAuditTrail} canResend={canEdit} onResend={handleResend}
              canEditNotes={canOverwriteEdit} ticketId={ticketId} onNoteEdited={load} />
          </div>
        </div>
      </div>
    </div>
  )
}
