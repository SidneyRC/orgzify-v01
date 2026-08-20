// THIS FILE GOES IN: components/shared/OREV1-114-EventStepTicketCategories.tsx (REPLACE EXISTING)
'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1114BTicketCategoryForm from '@/components/shared/OREV1-114B-TicketCategoryForm'
import OREV1114CTicketAssignDates from '@/components/shared/OREV1-114C-TicketAssignDates'; import OREV1114ETicketStepFooter from '@/components/shared/OREV1-114E-TicketStepFooter'
import OREV1114HTicketSlotGroups from '@/components/shared/OREV1-114H-TicketSlotGroups'
import OREV1114ITicketSlotEditForm from '@/components/shared/OREV1-114I-TicketSlotEditForm'
import OREV1114JTicketSaveConfirmModal from '@/components/shared/OREV1-114J-TicketSaveConfirmModal'
import OREV1114KTicketDeleteConfirm from '@/components/shared/OREV1-114K-TicketDeleteConfirm'
type Props = { eventId: string; locked: boolean; durationMinutes?: number; onContinue: () => void; onBack: () => void; onClose: () => void }
const API = '/biz/events/eventvenue/tickets/api'
function fmtDate(d: string) { return new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) }
function fmtTime(t: string) { const [h, m] = t.split(':'); const hr = parseInt(h, 10); const ap = hr >= 12 ? 'PM' : 'AM'; return `${hr % 12 === 0 ? 12 : hr % 12}:${m} ${ap}` }
export default function OREV1114EventStepTicketCategories({ eventId, locked, durationMinutes, onContinue, onBack, onClose }: Props) {
  const { theme } = useTheme()
  const [tickets, setTickets] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [assignments, setAssignments] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [editState, setEditState] = useState<{ ticket: any; clickedId: string } | null>(null)
  const [confirmSave, setConfirmSave] = useState<{ bulkSave: any; slotLabels: string[] } | null>(null)
  const [deleteState, setDeleteState] = useState<{ ticket: any; assignment: any } | null>(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [continueError, setContinueError] = useState('')
  const [loading, setLoading] = useState(true)
  const load = async () => { const j = await (await fetch(`${API}?event_id=${eventId}`)).json(); setTickets(j.tickets || []); setVenues(j.venues || []); setAssignments(j.assignments || []); setLoading(false) }
  useEffect(() => { load() }, [eventId])
  const allSlots = venues.flatMap((v: any) => (v.event_venue_dates || []).flatMap((d: any) => (d.event_venue_times || []).map((t: any) => ({ id: t.id, venue: v.venues?.external_name || 'Venue', date: d.event_date, time: t.start_time }))))
  const isMulti = allSlots.length > 1
  const emptySlots = allSlots.filter(s => !assignments.some((a: any) => a.event_venue_time_id === s.id))
  const allSlotDates = allSlots.map(s => `${s.date}T${s.time}`)
  const lastSlot = allSlotDates.length > 0 ? allSlotDates.sort().slice(-1)[0] : ''
  const defaultSaleEnd = lastSlot ? new Date(new Date(lastSlot).getTime() + (durationMinutes || 0) * 60000).toISOString().slice(0, 16) : ''
  const slotLabel = (id: string) => { const s = allSlots.find(x => x.id === id); return s ? `${s.venue} · ${fmtDate(s.date)} · ${fmtTime(s.time)}` : '' }
  const openNew = () => { setCreating(true); setAssignedIds(isMulti ? [] : allSlots.map(s => s.id)) }
  const saveNew = async (fields: any) => {
    if (isMulti && assignedIds.length === 0) { toast.error('Please select at least one date/time for this ticket.'); return }
    const j = await (await fetch(API, { method: 'POST', body: JSON.stringify({ event_id: eventId, fields, assignedTimeIds: assignedIds }) })).json()
    if (j.error) { toast.error(j.error); return }
    setCreating(false); load(); toast.success('Ticket added')
  }
  const toggleField = async (a: any, field: string) => { await fetch(API, { method: 'PUT', body: JSON.stringify({ assignment_id: a.id, [field]: !a[field] }) }); load() }
  const priceLabel = (isFree: boolean, p: number) => isFree ? 'Free' : `₹${p}`
  const openEditForm = (payload: any) => {
    const isFree = payload.identity.ticket_type === 'free'
    const labels = payload.checkedTimeIds.map((id: string) => {
      const existing = assignments.find((a: any) => a.ticket_type_id === editState!.ticket.id && a.event_venue_time_id === id)
      const old = existing ? priceLabel(isFree, existing.price) : 'new'
      return `${slotLabel(id)} — ${old} → ${priceLabel(isFree, payload.slot.price)}`
    })
    setConfirmSave({ bulkSave: { ticket_id: editState!.ticket.id, ...payload }, slotLabels: labels })
  }
  const confirmEditSave = async () => {
    setSaving(true)
    const j = await (await fetch(API, { method: 'PATCH', body: JSON.stringify({ bulkSave: confirmSave!.bulkSave }) })).json()
    setSaving(false)
    if (j.error) { toast.error(j.error); return }
    setConfirmSave(null); setEditState(null); load(); toast.success('Ticket updated')
  }
  const confirmDelete = async () => {
    setDeleting(true)
    const j = await (await fetch(`${API}?assignment_id=${deleteState!.assignment.id}`, { method: 'DELETE' })).json()
    setDeleting(false)
    if (j.error) { toast.error(j.error); return }
    setDeleteState(null); load(); toast.success('Ticket removed from this date/time')
  }
  const handleContinue = () => { if (emptySlots.length > 0) { setContinueError('Every date/time needs at least one ticket assigned before continuing. Add a ticket, or remove the unused date/time in Schedule.'); return } onContinue() }
  if (loading) return <p className="text-sm text-gray-400">Loading…</p>
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Ticket categories</p>
        {!locked && !creating && !editState && <button onClick={openNew} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: theme?.global_border_radius || '12px' }} className="text-sm px-4 py-2">+ Add ticket</button>}
      </div>
      {!creating && !editState && (
        <OREV1114HTicketSlotGroups venues={venues} tickets={tickets} assignments={assignments} locked={locked}
          onEdit={(ticket, a) => setEditState({ ticket, clickedId: a.id })} onDelete={(ticket, a) => setDeleteState({ ticket, assignment: a })}
          onToggleEnabled={(a) => toggleField(a, 'is_enabled')} onToggleFastSelling={(a) => toggleField(a, 'fast_selling_forced')} theme={theme} />
      )}
      {creating && (
        <div className={isMulti ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
          <OREV1114BTicketCategoryForm ticket={null} locked={locked} theme={theme} onCancel={() => setCreating(false)} onSave={saveNew} defaultSaleEnd={defaultSaleEnd} />
          {isMulti && <OREV1114CTicketAssignDates venues={venues} assignedIds={assignedIds} setAssignedIds={setAssignedIds} locked={locked} theme={theme} />}
        </div>
      )}
      {editState && (
        <OREV1114ITicketSlotEditForm ticket={editState.ticket} assignments={assignments.filter((a: any) => a.ticket_type_id === editState.ticket.id)}
          venues={venues} clickedAssignmentId={editState.clickedId} locked={locked} theme={theme} onCancel={() => setEditState(null)} onSave={openEditForm} />
      )}
      {confirmSave && <OREV1114JTicketSaveConfirmModal slotLabels={confirmSave.slotLabels} saving={saving} onConfirm={confirmEditSave} onCancel={() => setConfirmSave(null)} theme={theme} />}
      {deleteState && <OREV1114KTicketDeleteConfirm ticketName={deleteState.ticket.name} slotLabel={slotLabel(deleteState.assignment.event_venue_time_id)} deleting={deleting} onConfirm={confirmDelete} onCancel={() => setDeleteState(null)} theme={theme} />}
      {continueError && <p className="text-xs text-red-500">{continueError}</p>}
      {!creating && !editState && <OREV1114ETicketStepFooter canContinue={assignments.length > 0} onBack={onBack} onClose={onClose} onContinue={handleContinue} theme={theme} />}
    </div>
  )
}
