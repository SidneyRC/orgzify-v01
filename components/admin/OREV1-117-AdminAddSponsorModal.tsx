// THIS FILE GOES IN: components/admin/OREV1-117-AdminAddSponsorModal.tsx (NEW FILE)
'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import OREV1109BBannerCropUpload from '@/components/shared/OREV1-109B-BannerCropUpload'
const UPLOAD_API = '/admin/sponsors/upload-logo/api'
const ADMIN_SPONSORS_API = '/admin/sponsors/api'
type Sponsor = { id: string; name: string; logo_url: string | null }
type Props = { theme: any; onClose: () => void; onCreated: () => void; sponsor?: Sponsor }

export default function OREV1117AdminAddSponsorModal({ theme, onClose, onCreated, sponsor }: Props) {
  const isEditing = !!sponsor
  const [name, setName] = useState(sponsor?.name || '')
  const [logo, setLogo] = useState(sponsor?.logo_url || '')
  const [submitting, setSubmitting] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }

  const handleLogoSelect = async (f: File) => {
    const fd = new FormData(); fd.append('file', f)
    const res = await fetch(UPLOAD_API, { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Upload failed'); return }
    setLogo(json.data.logo_url)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const res = isEditing
      ? await fetch(ADMIN_SPONSORS_API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: sponsor!.id, name, logo_url: logo }) })
      : await fetch(ADMIN_SPONSORS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, logo_url: logo }) })
    const json = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    toast.success(isEditing ? 'Sponsor updated' : 'Sponsor added'); onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      {cropFile && <OREV1109BBannerCropUpload file={cropFile} theme={theme} aspect={1} label="Adjust logo crop (1:1 ratio)" onCancel={() => setCropFile(null)} onSave={f => { setCropFile(null); handleLogoSelect(f) }} />}
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-700">{isEditing ? 'Edit Sponsor' : 'Add Sponsor'}</p>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Sponsor name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="h-9 px-3 text-sm w-full focus:outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Logo (1:1, required)</label>
          {logo ? (
            <div className="relative w-20 h-20">
              <img src={logo} className="w-20 h-20 rounded-xl object-cover" />
              <button type="button" onClick={() => setLogo('')} className="absolute -top-1.5 -right-1.5 text-[10px] w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm">✕</button>
            </div>
          ) : (
            <label className="w-20 h-20 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:opacity-80 transition" style={{ borderColor: theme?.input_border || '#e5e7eb' }}>
              <span className="text-lg leading-none" style={{ color: theme?.btn_bg || '#1e3a8a' }}>+</span>
              <span className="text-[10px]" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Add Logo</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = '' }} />
            </label>
          )}
        </div>
        {!isEditing && <p className="text-[11px]" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Sponsors added by Admin are approved immediately.</p>}
        <div className="flex justify-end gap-2 mt-1">
          <button onClick={onClose} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }} className="px-4 py-2 text-sm">Cancel</button>
          <button disabled={!name.trim() || !logo || submitting} onClick={handleSubmit} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="px-4 py-2 text-sm disabled:opacity-40">{isEditing ? 'Save Changes' : 'Add Sponsor'}</button>
        </div>
      </div>
    </div>
  )
}
