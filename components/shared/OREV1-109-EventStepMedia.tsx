// THIS FILE GOES IN: components/shared/OREV1-109-EventStepMedia.tsx (REPLACES existing file)
'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import type { DragEndEvent } from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import OREV1109BBannerCropUpload from '@/components/shared/OREV1-109B-BannerCropUpload'
import OREV1109EMainBannerSection from '@/components/shared/OREV1-109E-MainBannerSection'
import OREV1109FGallerySection from '@/components/shared/OREV1-109F-GallerySection'
import OREV1109GMediaStepFooter from '@/components/shared/OREV1-109G-MediaStepFooter'
import OREV1109CSponsorsSocialLinks from '@/components/shared/OREV1-109C-SponsorsSocialLinks'
import type { EventDraft } from '@/components/shared/OREV1-100-EventRegistration'
const MEDIA_API = '/biz/events/media/api'
type Media = { id: string; media_type: string; file_url: string; is_default_banner: boolean; caption: string | null; sort_order: number; section?: string }
type Props = { event: EventDraft | null; locked: boolean; onSaved: (updated: EventDraft) => void; onBack: () => void; onClose: () => void }
export default function OREV1109EventStepMedia({ event, locked, onSaved, onBack, onClose }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const [banners, setBanners] = useState<Media[]>([])
  const [gallery, setGallery] = useState<Media[]>([])
  const [bannerError, setBannerError] = useState('')
  const [cropTarget, setCropTarget] = useState<{ file: File; section: 'banner' | 'gallery'; orientation?: 'horizontal' | 'vertical' } | null>(null)
  const loadMedia = () => {
    if (!event?.id) return
    fetch(`${MEDIA_API}?event_id=${event.id}`).then(r => r.json()).then(j => {
      const all: Media[] = j.data || []
      setBanners(all.filter(m => m.section === 'banner')); setGallery(all.filter(m => m.section === 'gallery').sort((a, b) => a.sort_order - b.sort_order))
    })
  }
  useEffect(loadMedia, [event?.id])
  const handleUpload = async (file: File, section: 'banner' | 'gallery', orientation?: 'horizontal' | 'vertical') => {
    if (!event?.id) return
    const fd = new FormData()
    fd.append('file', file); fd.append('event_id', event.id); fd.append('section', section); fd.append('consent_given', 'true')
    if (section === 'banner') fd.append('is_default_banner', banners.length === 0 ? 'true' : 'false')
    if (section === 'gallery' && orientation) fd.append('orientation', orientation)
    const res = await fetch(MEDIA_API, { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Upload failed'); return }
    toast.success(section === 'banner' ? 'Banner uploaded' : 'Added to gallery')
    setBannerError('')
    loadMedia()
  }
  const handleCropSave = (file: File) => {
    if (!cropTarget) return
    handleUpload(file, cropTarget.section, cropTarget.orientation); setCropTarget(null)
  }
  const handleCropCancel = () => setCropTarget(null)
  const handleBannerFileSelect = (f: File) => { if (f.type.startsWith('image/')) setCropTarget({ file: f, section: 'banner' }); else handleUpload(f, 'banner') }
  const handleGalleryFileSelect = (f: File) => {
    if (!f.type.startsWith('image/')) { handleUpload(f, 'gallery'); return }
    const img = new Image()
    img.onload = () => setCropTarget({ file: f, section: 'gallery', orientation: img.naturalWidth >= img.naturalHeight ? 'horizontal' : 'vertical' })
    img.src = URL.createObjectURL(f)
  }
  const handleSetDefault = async (id: string) => {
    const res = await fetch(MEDIA_API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'set_default' }) })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    loadMedia()
  }
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this item?')) return
    const res = await fetch(MEDIA_API, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    loadMedia()
  }
  const handleCaptionChange = async (id: string, val: string) => { await fetch(MEDIA_API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'update_caption', caption: val }) }) }
  const handleDragEnd = async (e: DragEndEvent) => {
    const { active, over } = e
    if (!over || active.id === over.id) return
    const reordered = arrayMove(gallery, gallery.findIndex(i => i.id === active.id), gallery.findIndex(i => i.id === over.id))
    setGallery(reordered)
    const payload = reordered.map((m, idx) => ({ id: m.id, sort_order: idx }))
    await fetch(MEDIA_API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reorder', id: payload[0].id, items: payload }) })
  }
  const handleContinue = async () => {
    if (banners.length === 0) { setBannerError('At least one banner is required, with one set as Default.'); return }
    if (!banners.some(b => b.is_default_banner)) { setBannerError('Please set one banner as Default.'); return }
    toast.success(event?.status === 'active' ? 'Changes sent for re-verification' : 'Saved'); onSaved(event as EventDraft)
  }
  const handleAdminNext = () => onSaved(event as EventDraft)
  const cropAspect = cropTarget?.section === 'gallery' ? (cropTarget.orientation === 'vertical' ? 1 / 1.5 : 2) : 2
  const cropLabel = cropTarget?.section === 'gallery' ? `Adjust gallery photo crop (${cropTarget.orientation === 'vertical' ? '1:1.5' : '2:1'} ratio, auto-detected)` : 'Adjust banner crop (2:1 ratio)'
  return (
    <div className="flex flex-col gap-8 max-w-3xl">
      {cropTarget && <OREV1109BBannerCropUpload file={cropTarget.file} onSave={handleCropSave} onCancel={handleCropCancel} theme={theme} aspect={cropAspect} label={cropLabel} requireConsent={cropTarget.section === 'gallery'} />}
      {locked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700">
          This event is awaiting Admin review and can't be edited right now.
        </div>
      )}
      <fieldset disabled={locked} className="flex flex-col gap-8 disabled:opacity-60">
        <OREV1109EMainBannerSection banners={banners} bannerError={bannerError} theme={theme} onSetDefault={handleSetDefault} onDelete={handleDelete} onFileSelect={handleBannerFileSelect} />
        <OREV1109FGallerySection gallery={gallery} theme={theme} radius={radius} onDragEnd={handleDragEnd} onDelete={handleDelete} onCaptionChange={handleCaptionChange} onFileSelect={handleGalleryFileSelect} />
        {event?.id && <OREV1109CSponsorsSocialLinks eventId={event.id} locked={locked} theme={theme} />}
      </fieldset>
      <OREV1109GMediaStepFooter locked={locked} onBack={onBack} onClose={onClose} onContinue={locked ? handleAdminNext : handleContinue} theme={theme} />
    </div>
  )
}