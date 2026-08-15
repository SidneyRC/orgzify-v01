// THIS FILE GOES IN: components/shared/OREV1-116-SponsorCreateForm.tsx (NEW FILE)
'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import OREV1109BBannerCropUpload from '@/components/shared/OREV1-109B-BannerCropUpload'
const SPONSORS_API = '/biz/events/sponsors/api'
const UPLOAD_API = '/biz/events/sponsors/upload-logo/api'
type Props = { theme: any; onDone: () => void }

export default function OREV1116SponsorCreateForm({ theme, onDone }: Props) {
  const [newName, setNewName] = useState('')
  const [newLogo, setNewLogo] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }

  const handleLogoSelect = async (f: File) => {
    const fd = new FormData(); fd.append('file', f)
    const res = await fetch(UPLOAD_API, { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Upload failed'); return }
    setNewLogo(json.data.logo_url)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const res = await fetch(SPONSORS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'create_sponsor', name: newName, logo_url: newLogo }) })
    const json = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    toast.success('Submitted for Admin approval. It will be searchable once approved.')
    onDone()
  }

  return (
    <div className="flex flex-col gap-3">
      {cropFile && <OREV1109BBannerCropUpload file={cropFile} theme={theme} aspect={1} label="Adjust logo crop (1:1 ratio)" onCancel={() => setCropFile(null)} onSave={f => { setCropFile(null); handleLogoSelect(f) }} />}
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Sponsor name</label>
        <input value={newName} onChange={e => setNewName(e.target.value)} className="h-9 px-3 text-sm w-full focus:outline-none" style={inputStyle} />
      </div>
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Logo (1:1, required)</label>
        {newLogo ? (
          <div className="relative w-20 h-20">
            <img src={newLogo} className="w-20 h-20 rounded-xl object-cover" />
            <button type="button" onClick={() => setNewLogo('')} className="absolute -top-1.5 -right-1.5 text-[10px] w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm">✕</button>
          </div>
        ) : (
          <label className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:opacity-80 transition" style={{ borderColor: theme?.input_border || '#e5e7eb' }}>
            <span className="text-lg leading-none" style={{ color: theme?.btn_bg || '#1e3a8a' }}>+</span>
            <span className="text-[10px]" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Add Logo</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = '' }} />
          </label>
        )}
      </div>
      <p className="text-[11px]" style={{ color: theme?.color_text_muted || '#9ca3af' }}>New sponsors are reviewed by Admin before they can be added to any event.</p>
      <div className="flex gap-2">
        <button type="button" onClick={onDone} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }} className="px-4 py-1.5 text-sm">Cancel</button>
        <button type="button" disabled={!newName.trim() || !newLogo || submitting} onClick={handleSubmit} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="px-4 py-1.5 text-sm disabled:opacity-40">Submit for approval</button>
      </div>
    </div>
  )
}
