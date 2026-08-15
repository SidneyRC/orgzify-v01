// THIS FILE GOES IN: components/shared/OREV1-104-EventSection3Banners.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1104BConsentUpload from '@/components/shared/OREV1-104B-ConsentUpload'
import OREV1059ConfirmModal from '@/components/admin/OREV1-059-ConfirmModal'
import type { EventDraft } from '@/components/shared/OREV1-100-EventRegistration'

const MEDIA_API = '/biz/events/media/api'
const EVENTS_API = '/biz/events/api'
type Media = { id: string; media_type: string; file_url: string; is_default_banner: boolean }
type Props = { event: EventDraft | null; open: boolean; onToggle: () => void; onSaved: (updated: EventDraft) => void; onBack: () => void; closeUrl: string }

const SOCIAL_FIELDS = [
  { key: 'social_facebook_url', label: 'Facebook' }, { key: 'social_instagram_url', label: 'Instagram' },
  { key: 'social_x_url', label: 'X (Twitter)' }, { key: 'social_youtube_url', label: 'YouTube' },
  { key: 'social_website_url', label: 'Website' },
]

export default function OREV1104EventSection3Banners({ event, open, onToggle, onSaved, onBack, closeUrl }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [banners, setBanners] = useState<Media[]>([])
  const [links, setLinks] = useState<Record<string, string>>(
    Object.fromEntries(SOCIAL_FIELDS.map(f => [f.key, (event as any)?.[f.key] || '']))
  )
  const [saving, setSaving] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const isLocked = event?.status === 'pending'

  const loadBanners = () => {
    if (!event?.id) return
    fetch(`${MEDIA_API}?event_id=${event.id}`).then(r => r.json()).then(j => setBanners((j.data || []).filter((m: Media & { section?: string }) => (m as any).section === 'banner')))
  }
  useEffect(loadBanners, [event?.id])

  const handleClose = () => router.push(closeUrl)

  const handleUpload = async (file: File) => {
    if (!event?.id) return
    const fd = new FormData()
    fd.append('file', file); fd.append('event_id', event.id); fd.append('section', 'banner')
    fd.append('consent_given', 'true'); fd.append('is_default_banner', banners.length === 0 ? 'true' : 'false')
    const res = await fetch(MEDIA_API, { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Upload failed'); return }
    toast.success('Banner uploaded'); loadBanners()
  }

  const handleSetDefault = async (id: string) => {
    const res = await fetch(MEDIA_API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, action: 'set_default' }) })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    loadBanners()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this banner?')) return
    const res = await fetch(MEDIA_API, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    loadBanners()
  }

  const handleSaveLinks = async () => {
    if (!event?.id) return
    setSaving(true)
    const res = await fetch(EVENTS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'save_social_links', id: event.id, ...links }) })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success('Saved'); onSaved(json.data)
  }

  const isComplete = banners.length > 0

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{isComplete ? '✓' : '3'}</span>
          <p className="text-sm font-semibold text-gray-700">Banners</p>
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
          <fieldset disabled={isLocked} className="flex flex-col gap-5 disabled:opacity-60">
            <div>
              <label className="text-xs text-gray-500 mb-2 block">Banners ({banners.length}/10)</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
                {banners.map(b => (
                  <div key={b.id} className="relative rounded-xl overflow-hidden border border-gray-100 aspect-video bg-gray-50">
                    {b.media_type === 'image'
                      ? <img src={b.file_url} className="w-full h-full object-cover" alt="Banner" />
                      : <video src={b.file_url} className="w-full h-full object-cover" />}
                    {b.is_default_banner && <span className="absolute top-1 left-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-600 text-white">Default</span>}
                    <div className="absolute bottom-1 right-1 flex gap-1">
                      {b.media_type === 'image' && !b.is_default_banner && (
                        <button onClick={() => handleSetDefault(b.id)} className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 hover:bg-white">Set Default</button>
                      )}
                      <button onClick={() => handleDelete(b.id)} className="text-[10px] px-2 py-0.5 rounded-full bg-white/90 hover:bg-white text-red-600">✕</button>
                    </div>
                  </div>
                ))}
              </div>
              {banners.length < 10 && (
                <OREV1104BConsentUpload accept="image/*,video/*" label="Upload Banner" theme={theme} radius={radius} onUpload={handleUpload} />
              )}
            </div>

            <div>
              <label className="text-xs text-gray-500 mb-2 block">Social Media Links (optional)</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {SOCIAL_FIELDS.map(f => (
                  <input key={f.key} value={links[f.key]} onChange={e => setLinks({ ...links, [f.key]: e.target.value })}
                    placeholder={f.label} className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
                ))}
              </div>
            </div>
          </fieldset>

          <div className="pt-2">
            <div className="hidden sm:flex sm:justify-end sm:gap-2">
              <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition">← Back</button>
              <button onClick={() => setShowCloseConfirm(true)} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition">✕ Close</button>
              {!isLocked && <button onClick={handleSaveLinks} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50">{saving ? 'Saving…' : 'Save & Continue'}</button>}
            </div>
            <div className="flex gap-1.5 sm:hidden">
              <button onClick={onBack} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1">← Back</button>
              <button onClick={() => setShowCloseConfirm(true)} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1">✕ Close</button>
              {!isLocked && <button onClick={handleSaveLinks} disabled={saving} style={primaryBtn} className="flex-1 text-xs font-medium py-2 px-1 disabled:opacity-50">{saving ? '…' : 'Save'}</button>}
            </div>
          </div>
        </div>
      )}
      <OREV1059ConfirmModal open={showCloseConfirm} title="Leave without saving?" message="Any unsaved changes on this section will be lost." onCancel={() => setShowCloseConfirm(false)} onConfirm={handleClose} />
    </div>
  )
}
