'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import RejectReasonModal from '@/components/admin/OREV1-077-RejectReasonModal'

type Props = { ticketId: string; entityId: string; entityName: string; subCategory: string; onResult: (closed: boolean) => void }

const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft', pending: 'Pending', active: 'Active', rejected: 'Rejected', suspended: 'Suspended', blocked: 'Blocked', archived: 'Archived'
}

const IconAccept = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
const IconReject = () => <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>

export default function OREV1085TicketApprovalAction({ ticketId, entityId, entityName, subCategory, onResult }: Props) {
  const { theme } = useTheme()
  const [busy, setBusy] = useState(false)
  const [showReject, setShowReject] = useState(false)

  if (subCategory !== 'New Submission') return null

  const logNote = async (message: string) => {
    await fetch('/admin/ecosystem/support/api', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: ticketId, action: 'note', message, visible_to_entity: false })
    })
  }

  const closeTicket = async () => {
    await fetch('/admin/ecosystem/support/api', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ticket_id: ticketId, action: 'change_status', new_status: 'Closed' })
    })
  }

  const checkEntityStatus = async (): Promise<string> => {
    const res = await fetch(`/admin/ecosystem/support/api?type=entity_status&entity_id=${entityId}`)
    const json = await res.json()
    return json.status || ''
  }

  const handleApprove = async () => {
    setBusy(true)
    const status = await checkEntityStatus()
    if (status !== 'pending') {
      await logNote(`Approve attempted but blocked — entity status is currently ${STATUS_LABELS[status] || status}.`)
      toast.error(`Blocked — entity status is currently ${STATUS_LABELS[status] || status}.`)
      setBusy(false); onResult(false); return
    }
    const res = await fetch('/admin/ecosystem/entities/api', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: entityId, status: 'active', expected_status: 'pending' })
    })
    if (res.status === 409) {
      const json = await res.json()
      await logNote(`Approve attempted but blocked — entity status is currently ${STATUS_LABELS[json.current_status] || json.current_status}.`)
      toast.error('Already handled elsewhere.'); setBusy(false); onResult(false); return
    }
    if (!res.ok) { toast.error('Approve failed'); setBusy(false); return }
    await closeTicket()
    toast.success('Entity approved. Ticket closed.')
    setBusy(false); onResult(true)
  }

  const handleRejectConfirm = async (reasonId?: string, reasonNote?: string) => {
    setShowReject(false); setBusy(true)
    const status = await checkEntityStatus()
    if (status !== 'pending') {
      await logNote(`Reject attempted but blocked — entity status is currently ${STATUS_LABELS[status] || status}.`)
      toast.error(`Blocked — entity status is currently ${STATUS_LABELS[status] || status}.`)
      setBusy(false); onResult(false); return
    }
    const res = await fetch('/admin/ecosystem/entities/api', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: entityId, status: 'rejected', expected_status: 'pending', reason_id: reasonId, reason_note: reasonNote })
    })
    if (res.status === 409) {
      const json = await res.json()
      await logNote(`Reject attempted but blocked — entity status is currently ${STATUS_LABELS[json.current_status] || json.current_status}.`)
      toast.error('Already handled elsewhere.'); setBusy(false); onResult(false); return
    }
    if (!res.ok) { toast.error('Reject failed'); setBusy(false); return }
    await closeTicket()
    toast.success('Entity rejected. Ticket closed.')
    setBusy(false); onResult(true)
  }

  const radius = theme?.global_border_radius || '12px'

  return (
    <div className="flex gap-3 items-center border-t border-gray-100 pt-4">
      <span className="text-xs text-gray-500 mr-1">Entity Review:</span>
      <button disabled={busy} onClick={handleApprove} title="Approve" style={{ borderRadius: radius }} className="text-green-500 hover:text-green-700 transition p-1.5 hover:bg-green-50 disabled:opacity-50 flex items-center gap-1 text-xs font-medium"><IconAccept /> Approve</button>
      <button disabled={busy} onClick={() => setShowReject(true)} title="Reject" style={{ borderRadius: radius }} className="text-red-500 hover:text-red-700 transition p-1.5 hover:bg-red-50 disabled:opacity-50 flex items-center gap-1 text-xs font-medium"><IconReject /> Reject</button>
      {showReject && (
        <RejectReasonModal
          entityName={entityName}
          statusCode="rejected"
          onCancel={() => setShowReject(false)}
          onConfirm={(reasonId, note) => handleRejectConfirm(reasonId, note)}
        />
      )}
    </div>
  )
}