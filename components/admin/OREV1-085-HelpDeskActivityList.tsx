// GOES IN: components/admin/OREV1-085-HelpDeskActivityList.tsx
'use client'
import { useState } from 'react'

type Activity = {
  id: string; activity_type: string; message: string | null; field_changed: string | null
  old_value: string | null; new_value: string | null; visibility: string; is_edited: boolean; created_at: string
  author_label?: string
}
type Props = {
  activity: Activity[]; showFullDetail: boolean; canResend?: boolean; onResend?: (statusCode: string) => void
  canEditNotes?: boolean; ticketId?: string; onNoteEdited?: () => void
}

const MILESTONE_STATUSES = ['correction', 'closed', 'reopened']
const STATUS_LABELS: Record<string, string> = {
  new: 'New', pending: 'Pending', correction: 'Correction', resubmitted: 'Resubmitted',
  escalate: 'Escalate', closed: 'Closed', reopened: 'Reopened'
}

function groupByDay(items: Activity[]) {
  const groups: { day: string; items: Activity[] }[] = []
  for (const a of items) {
    const day = new Date(a.created_at).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    const last = groups[groups.length - 1]
    if (last && last.day === day) last.items.push(a); else groups.push({ day, items: [a] })
  }
  return groups
}
function isMilestone(a: Activity) {
  return a.activity_type === 'created' || (a.activity_type === 'status_change' && MILESTONE_STATUSES.includes(a.new_value || ''))
}
function milestoneLabel(a: Activity) {
  if (a.activity_type === 'created') return 'Ticket Created'
  const oldLabel = a.old_value ? (STATUS_LABELS[a.old_value] || a.old_value) : null
  const newLabel = STATUS_LABELS[a.new_value || ''] || a.new_value
  return oldLabel ? `${oldLabel} → ${newLabel}` : newLabel
}

export default function OREV1085HelpDeskActivityList({ activity, showFullDetail, canResend = false, onResend, canEditNotes = false, ticketId, onNoteEdited }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  const saveEdit = async (activityId: string) => {
    if (!ticketId) return
    const res = await fetch('/admin/ecosystem/helpdesk/api', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: ticketId, action: 'edit_note', activity_id: activityId, new_message: editText })
    })
    if (res.ok) { setEditingId(null); onNoteEdited?.() }
  }

  const visible = showFullDetail ? activity : activity.filter(a => a.activity_type !== 'status_change' || a.message)
  if (visible.length === 0) return <p className="text-sm text-gray-400 text-center py-8">No activity yet.</p>

  const groups = groupByDay(visible)

  return (
    <div className="flex flex-col gap-5">
      {groups.map(g => (
        <div key={g.day} className="flex flex-col gap-3">
          <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">{g.day}</p>
          {g.items.map(a => isMilestone(a) ? (
            <div key={a.id} className="flex flex-col gap-0.5">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-gray-700">
                  {milestoneLabel(a)}{showFullDetail && a.author_label ? ` | ${a.author_label}` : ''}
                </span>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-gray-400">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                  {canResend && onResend && (
                    <button onClick={() => onResend(a.activity_type === 'created' ? 'new' : (a.new_value || 'new'))} className="text-xs text-blue-600 hover:text-blue-800">↻ Email</button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div key={a.id} className="flex gap-3">
              <div className="w-1.5 rounded-full mt-1" style={{ backgroundColor: a.activity_type === 'status_change' ? '#93c5fd' : '#e5e7eb' }} />
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${a.visibility === 'external' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {a.visibility === 'external' ? '● Visible to Raiser' : '● Internal only'}
                  </span>
                  {showFullDetail && a.author_label && <span className="text-[11px] text-gray-400">| {a.author_label}</span>}
                  {a.is_edited && <span className="text-[11px] text-gray-400 italic">edited</span>}
                  <span className="text-[11px] text-gray-400 ml-auto">{new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                {a.activity_type === 'status_change' && showFullDetail && (
                  <p className="text-sm text-gray-700">Status: <span className="font-medium">{a.old_value}</span> → <span className="font-medium">{a.new_value}</span></p>
                )}
                {a.message && editingId === a.id ? (
                  <div className="flex flex-col gap-1">
                    <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={2} className="text-sm border border-gray-200 rounded-lg px-2 py-1" />
                    <div className="flex gap-2">
                      <button onClick={() => saveEdit(a.id)} className="text-xs text-blue-600">Save</button>
                      <button onClick={() => setEditingId(null)} className="text-xs text-gray-400">Cancel</button>
                    </div>
                  </div>
                ) : a.message && (
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm text-gray-700 leading-relaxed">{a.message}</p>
                    {canEditNotes && a.activity_type === 'note' && (
                      <button onClick={() => { setEditingId(a.id); setEditText(a.message || '') }} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">✎</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      ))}
    </div>
  )
}
