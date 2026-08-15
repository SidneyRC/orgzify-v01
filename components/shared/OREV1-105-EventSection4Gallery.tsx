// THIS FILE GOES IN: components/shared/OREV1-105-EventSection4Gallery.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, arrayMove, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import OREV1104BConsentUpload from '@/components/shared/OREV1-104B-ConsentUpload'
import OREV1059ConfirmModal from '@/components/admin/OREV1-059-ConfirmModal'
import type { EventDraft } from '@/components/shared/OREV1-100-EventRegistration'

const MEDIA_API = '/biz/events/media/api'
type Media = { id: string; media_type: string; file_url: string; caption: string | null; sort_order: number }
type Props = { event: EventDraft | null; open: boolean; onToggle: () => void; onSaved: (updated: EventDraft) => void; onBack: () => void; closeUrl: string }

function SortableCard({ m, theme, onDeleteAction, onCaptionChange }: { m: Media; theme: any; onDeleteAction: (id: string) => void; onCaptionChange: (id: string, val: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: m.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
      <div {...attributes} {...listeners} className="aspect-video relative cursor-grab active:cursor-grabbing">
        {m.media_type === 'image' ? <img src={m.file_url} className="w-full h-full object-cover" alt="Gallery" /> : <video src={m.file_url} className="w-full h-full object-cover" />}
        <button onClick={() => onDeleteAction(m.id)} className="absolute top-1 right-1 text-[10px] px-2 py-0.5 rounded-full bg-white/90 hover:bg-white text-red-600">✕</button>
      </div>
      <input defaultValue={m.caption || ''} onBlur={e => onCaptionChange(m.id, e.target.value)} placeholder="Caption (optional)"
        className="w-full text-xs px-2 py-1.5 focus:outline-none" style={{ color: theme?.color_text_muted || '#6b7280' }} />
    </div>
  )
}

export default function OREV1105EventSection4Gallery({ event, open, onToggle, onSaved, onBack, closeUrl }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }

  const [items, setItems] = useState<Media[]>([])
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const isLocked = event?.status === 'pending'
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const loadItems = () => {
    if (!event?.id) return
    fetch(`${MEDIA_API}?event_id=${event.id}`).then(r => r.json()).then(j =>
      setItems((j.data || []).filter((m: Media & { section?: string }) => (m as any).section === 'gallery').sort((a: Media, b: Media) => a.sort_order - b.sort_order))
    )
  }
  useEffect(loadItems, [event?.id])

  const handleClose = () => router.push(closeUrl)

  const handleUpload = async (file: File) => {
    if (!event?.id) return
    const fd = new FormData()
    fd.append('file', file); fd.append('event_id', event.id); fd.append('section', 'gallery'); fd.append('consent_given', 'true')
    const res = await fetch(MEDIA_API, { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Upload failed'); return }
    toast.success('Added to gallery'); loadItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this photo/video?')) return
    const res = await fetch(MEDIA_API, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    loadItems()
  }

  const handleCaptionChange = async (id: string, val: string) => {
    await fetch(MEDIA_API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'update_caption', caption: val }) })
  }

  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex(i => i.id === active.id)
    const newIndex = items.findIndex(i => i.id === over.id)
    const reordered = arrayMove(items, oldIndex, newIndex)
    setItems(reordered)
    const payload = reordered.map((m, idx) => ({ id: m.id, sort_order: idx }))
    await fetch(MEDIA_API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reorder', id: payload[0].id, items: payload }) })
  }

  const isComplete = items.length > 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{isComplete ? '✓' : '4'}</span>
          <p className="text-sm font-semibold text-gray-700">Gallery</p>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 flex flex-col gap-5 border-t border-gray-50 pt-5">
          {isLocked && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700">
              This event is awaiting Admin review and can't be edited right now.
            </div>
          )}
          <fieldset disabled={isLocked} className="flex flex-col gap-4 disabled:opacity-60">
            {items.length > 0 && (
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={items.map(i => i.id)} strategy={rectSortingStrategy}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {items.map(m => <SortableCard key={m.id} m={m} theme={theme} onDeleteAction={handleDelete} onCaptionChange={handleCaptionChange} />)}
                  </div>
                </SortableContext>
              </DndContext>
            )}
            <OREV1104BConsentUpload accept="image/*,video/*" label="Add to Gallery" theme={theme} radius={radius} onUpload={handleUpload} />
          </fieldset>

          <div className="pt-2">
            <div className="hidden sm:flex sm:justify-end sm:gap-2">
              <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition">← Back</button>
              <button onClick={() => setShowCloseConfirm(true)} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition">✕ Close</button>
              <button onClick={() => onSaved(event!)} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition">Continue</button>
            </div>
            <div className="flex gap-1.5 sm:hidden">
              <button onClick={onBack} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1">← Back</button>
              <button onClick={() => setShowCloseConfirm(true)} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1">✕ Close</button>
              <button onClick={() => onSaved(event!)} style={primaryBtn} className="flex-1 text-xs font-medium py-2 px-1">Continue</button>
            </div>
          </div>
        </div>
      )}
      <OREV1059ConfirmModal open={showCloseConfirm} title="Leave without saving?" message="Any unsaved changes on this section will be lost." onCancel={() => setShowCloseConfirm(false)} onConfirm={handleClose} />
    </div>
  )
}
