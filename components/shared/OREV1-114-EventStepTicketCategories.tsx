// THIS FILE GOES IN: components/shared/OREV1-114-EventStepTicketCategories.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import OREV1114DTicketCard from '@/components/shared/OREV1-114D-TicketCard'
import OREV1114BTicketCategoryForm from '@/components/shared/OREV1-114B-TicketCategoryForm'
import OREV1114CTicketAssignDates from '@/components/shared/OREV1-114C-TicketAssignDates'
import OREV1114ETicketStepFooter from '@/components/shared/OREV1-114E-TicketStepFooter'
type Props = { eventId: string; locked: boolean; durationMinutes?: number; onContinue: () => void; onBack: () => void; onClose: () => void }
const API = '/biz/events/eventvenue/tickets/api'
export default function OREV1114EventStepTicketCategories({ eventId, locked, durationMinutes, onContinue, onBack, onClose }: Props) {
  const { theme } = useTheme()
  const [tickets, setTickets] = useState<any[]>([])
  const [venues, setVenues] = useState<any[]>([])
  const [assignMap, setAssignMap] = useState<Record<string, string[]>>({})
  const [editing, setEditing] = useState<any | 'new' | null>(null)
  const [assignedIds, setAssignedIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const load = async () => {
    const res = await fetch(`${API}?event_id=${eventId}`)
    const j = await res.json()
    setTickets((j.tickets || []).sort((a: any, b: any) => a.display_order - b.display_order))
    setVenues(j.venues || [])
    const map: Record<string, string[]> = {}
    ;(j.assignments || []).forEach((a: any) => { map[a.ticket_type_id] = [...(map[a.ticket_type_id] || []), a.event_venue_time_id] })
    setAssignMap(map)
    setLoading(false)
  }
  useEffect(() => { load() }, [eventId])
  const totalSlots = venues.reduce((n, v) => n + (v.event_venue_dates || []).reduce((m: number, d: any) => m + (d.event_venue_times?.length || 0), 0), 0)
  const isMulti = totalSlots > 1
  const allSlotIds = venues.flatMap((v: any) => (v.event_venue_dates || []).flatMap((d: any) => (d.event_venue_times || []).map((t: any) => t.id)))
  const allSlotDates = venues.flatMap((v: any) => (v.event_venue_dates || []).flatMap((d: any) => (d.event_venue_times || []).map((t: any) => `${d.event_date}T${t.start_time}`)))
  const lastSlot = allSlotDates.length > 0 ? allSlotDates.sort().slice(-1)[0] : ''
  const defaultSaleEnd = lastSlot ? new Date(new Date(lastSlot).getTime() + (durationMinutes || 0) * 60000).toISOString().slice(0, 16) : ''
  const openNew = () => { setEditing('new'); setAssignedIds(isMulti ? [] : allSlotIds) }
  const openEdit = (t: any) => { setEditing(t); setAssignedIds(assignMap[t.id] || allSlotIds) }
  const save = async (fields: any) => {
    const res = await fetch(API, { method: 'POST', body: JSON.stringify({ event_id: eventId, id: editing?.id, fields, assignedTimeIds: assignedIds }) })
    const j = await res.json()
    if (j.error) { alert(j.error); return }
    setEditing(null); load()
  }
  const remove = async (id: string) => {
    const res = await fetch(`${API}?id=${id}`, { method: 'DELETE' })
    const j = await res.json()
    if (j.error) { alert(j.error); return }
    load()
  }
  const quickUpdate = async (t: any, changed: any) => {
    await fetch(API, { method: 'POST', body: JSON.stringify({ event_id: eventId, id: t.id, fields: { ...t, ...changed }, assignedTimeIds: assignMap[t.id] || [] }) })
    load()
  }
  const move = async (index: number, dir: -1 | 1) => {
    const next = [...tickets]
    const swap = index + dir
    if (swap < 0 || swap >= next.length) return
    ;[next[index], next[swap]] = [next[swap], next[index]]
    setTickets(next)
    await fetch(API, { method: 'PATCH', body: JSON.stringify({ order: next.map((t, i) => ({ id: t.id, display_order: i })) }) })
  }
  if (loading) return <p className="text-sm text-gray-400">Loading…</p>
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-gray-700">Ticket categories</p>
        {!locked && editing === null && <button onClick={openNew} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: theme?.global_border_radius || '12px' }} className="text-sm px-4 py-2">+ Add ticket</button>}
      </div>
      {editing === null && tickets.map((t, i) => (
        <div key={t.id} className="flex items-center gap-2">
          <div className="flex flex-col">
            <button onClick={() => move(i, -1)} className="text-gray-400 text-xs">▲</button>
            <button onClick={() => move(i, 1)} className="text-gray-400 text-xs">▼</button>
          </div>
          <div className="flex-1">
            <OREV1114DTicketCard ticket={t} locked={locked} theme={theme}
              onToggleEnabled={() => quickUpdate(t, { is_enabled: !t.is_enabled })}
              onToggleFastSelling={() => quickUpdate(t, { fast_selling_forced: !t.fast_selling_forced })}
              onEdit={() => openEdit(t)} onDelete={() => remove(t.id)} />
          </div>
        </div>
      ))}
      {editing !== null && (
        <div className={isMulti ? 'grid grid-cols-1 sm:grid-cols-2 gap-4' : ''}>
          <OREV1114BTicketCategoryForm ticket={editing === 'new' ? null : editing} locked={locked} theme={theme} onCancel={() => setEditing(null)} onSave={save} defaultSaleEnd={defaultSaleEnd} />
          {isMulti && <OREV1114CTicketAssignDates venues={venues} assignedIds={assignedIds} setAssignedIds={setAssignedIds} locked={locked} theme={theme} />}
        </div>
      )}
      {editing === null && <OREV1114ETicketStepFooter canContinue={tickets.length > 0} onBack={onBack} onClose={onClose} onContinue={onContinue} theme={theme} />}
    </div>
  )
}
