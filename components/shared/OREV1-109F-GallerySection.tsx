// THIS FILE GOES IN: components/shared/OREV1-109F-GallerySection.tsx (REPLACES existing file)
'use client'
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core'
import { SortableContext, useSortable, rectSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

type Media = { id: string; media_type: string; file_url: string; caption: string | null }
type Props = { gallery: Media[]; theme: any; radius: string; onDragEnd: (e: DragEndEvent) => void; onDelete: (id: string) => void; onCaptionChange: (id: string, val: string) => void; onFileSelect: (f: File) => void }

function SortableTile({ m, onDeleteAction, onCaptionChange }: { m: Media; onDeleteAction: (id: string) => void; onCaptionChange: (id: string, val: string) => void }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: m.id })
  const style = { transform: CSS.Transform.toString(transform), transition }
  return (
    <div ref={setNodeRef} style={style} className="rounded-xl overflow-hidden border border-gray-100 bg-gray-50">
      <div {...attributes} {...listeners} className="aspect-video relative cursor-grab active:cursor-grabbing">
        {m.media_type === 'image' ? <img src={m.file_url} className="w-full h-full object-cover" alt="Gallery" /> : <video src={m.file_url} className="w-full h-full object-cover" />}
        <button onClick={() => onDeleteAction(m.id)} className="absolute top-1 right-1 text-[10px] px-2 py-0.5 rounded-full bg-white/90 hover:bg-white text-red-600">✕</button>
      </div>
      <input defaultValue={m.caption || ''} onBlur={e => onCaptionChange(m.id, e.target.value)} placeholder="Caption (optional)" className="w-full text-xs px-2 py-1.5 focus:outline-none text-gray-500" />
    </div>
  )
}

export default function OREV1109FGallerySection({ gallery, theme, radius, onDragEnd, onDelete, onCaptionChange, onFileSelect }: Props) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))
  return (
    <div>
      <h3 className="text-sm font-semibold mb-1" style={{ color: theme?.color_text_primary || '#111827' }}>Gallery (optional)</h3>
      <p className="text-xs mb-3" style={{ color: theme?.color_text_muted || '#9ca3af' }}>No limit — drag to reorder, add captions if useful. Orientation is detected automatically from each photo.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
        {gallery.length > 0 && (
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={gallery.map(i => i.id)} strategy={rectSortingStrategy}>
              {gallery.map(m => <SortableTile key={m.id} m={m} onDeleteAction={onDelete} onCaptionChange={onCaptionChange} />)}
            </SortableContext>
          </DndContext>
        )}
        <label className="aspect-video rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1 cursor-pointer hover:opacity-80 transition" style={{ borderColor: theme?.input_border || '#e5e7eb' }}>
          <span className="text-2xl" style={{ color: theme?.btn_bg || '#1e3a8a' }}>+</span>
          <span className="text-xs" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Add to Gallery</span>
          <input type="file" accept="image/*,video/*" className="hidden" onChange={e => {
            const f = e.target.files?.[0]
            if (f) onFileSelect(f)
            e.target.value = ''
          }} />
        </label>
      </div>
    </div>
  )
}
