'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

type Activity = { id: string; activity_type: string; message: string; visible_to_entity: boolean; is_edited: boolean; created_at: string }
type Props = { ticketId: string; isSuperAdmin?: boolean; refreshKey: number }

export default function OREV1084TicketActivityList({ ticketId, isSuperAdmin, refreshKey }: Props) {
  const [rows, setRows] = useState<Activity[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  useEffect(() => {
    setLoading(true)
    fetch(`/admin/ecosystem/support/api?type=activity&ticket_id=${ticketId}`).then(r => r.json()).then(j => { setRows(j.data || []); setLoading(false) })
  }, [ticketId, refreshKey])

  const saveEdit = async (activityId: string) => {
    const res = await fetch('/admin/ecosystem/support/api', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: ticketId, action: 'edit_note', activity_id: activityId, new_message: editText })
    })
    if (!res.ok) { toast.error('Not authorised or failed'); return }
    setRows(prev => prev.map(r => r.id === activityId ? { ...r, message: editText, is_edited: true } : r))
    setEditingId(null)
  }

  if (loading) return <p className="text-sm text-gray-400 text-center py-6">Loading…</p>
  if (rows.length === 0) return <p className="text-sm text-gray-400 text-center py-6">No activity yet.</p>

  return (
    <div className="flex flex-col gap-3">
      {rows.map(r => (
        <div key={r.id} className="border-l-2 border-gray-200 pl-3">
          <p className="text-xs text-gray-400">
            {new Date(r.created_at).toLocaleString()}
            {r.activity_type === 'status_change' && ' • Status Change'}
            {' • '}<span className={r.visible_to_entity ? 'text-green-600' : 'text-gray-400'}>{r.visible_to_entity ? 'Visible to Entity' : 'Internal'}</span>
            {r.is_edited && <span className="italic"> (edited)</span>}
          </p>
          {editingId === r.id ? (
            <div className="flex flex-col gap-1 mt-1">
              <textarea value={editText} onChange={e => setEditText(e.target.value)} className="text-sm border border-gray-200 rounded-lg px-2 py-1" rows={2} />
              <div className="flex gap-2"><button onClick={() => saveEdit(r.id)} className="text-xs text-blue-600">Save</button><button onClick={() => setEditingId(null)} className="text-xs text-gray-400">Cancel</button></div>
            </div>
          ) : (
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm text-gray-700">{r.message}</p>
              {isSuperAdmin && <button onClick={() => { setEditingId(r.id); setEditText(r.message) }} className="text-xs text-gray-400 hover:text-gray-600 shrink-0">✎</button>}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}