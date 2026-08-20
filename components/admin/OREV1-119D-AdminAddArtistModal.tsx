// THIS FILE GOES IN: components/admin/OREV1-119D-AdminAddArtistModal.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import OREV1109BBannerCropUpload from '@/components/shared/OREV1-109B-BannerCropUpload'
const UPLOAD_API = '/admin/artists/upload-photo/api'
const ADMIN_ARTISTS_API = '/admin/artists/api'
type Speciality = { id: string; name: string }
type Artist = { id: string; name: string; photo_url: string | null; speciality_id?: string }
type Props = { theme: any; onClose: () => void; onCreated: () => void; artist?: Artist }

export default function OREV1119DAdminAddArtistModal({ theme, onClose, onCreated, artist }: Props) {
  const isEditing = !!artist
  const [name, setName] = useState(artist?.name || '')
  const [photo, setPhoto] = useState(artist?.photo_url || '')
  const [specialities, setSpecialities] = useState<Speciality[]>([])
  const [specialityId, setSpecialityId] = useState(artist?.speciality_id || '')
  const [submitting, setSubmitting] = useState(false)
  const [cropFile, setCropFile] = useState<File | null>(null)
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }

  useEffect(() => { fetch(`${ADMIN_ARTISTS_API}?type=specialities`).then(r => r.json()).then(j => setSpecialities(j.data || [])) }, [])

  const handlePhotoSelect = async (f: File) => {
    const fd = new FormData(); fd.append('file', f)
    const res = await fetch(UPLOAD_API, { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Upload failed'); return }
    setPhoto(json.data.photo_url)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const res = isEditing
      ? await fetch(ADMIN_ARTISTS_API, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: artist!.id, name, photo_url: photo, speciality_id: specialityId }) })
      : await fetch(ADMIN_ARTISTS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, photo_url: photo, speciality_id: specialityId }) })
    const json = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    toast.success(isEditing ? 'Artist updated' : 'Artist added'); onCreated()
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      {cropFile && <OREV1109BBannerCropUpload file={cropFile} theme={theme} aspect={1} label="Adjust photo crop (1:1 ratio)" onCancel={() => setCropFile(null)} onSave={f => { setCropFile(null); handlePhotoSelect(f) }} />}
      <div className="bg-white rounded-2xl p-5 max-w-sm w-full flex flex-col gap-3">
        <p className="text-sm font-semibold text-gray-700">{isEditing ? 'Edit Artist' : 'Add Artist'}</p>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Artist name</label>
          <input value={name} onChange={e => setName(e.target.value)} className="h-9 px-3 text-sm w-full focus:outline-none" style={inputStyle} />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Speciality</label>
          <select value={specialityId} onChange={e => setSpecialityId(e.target.value)} className="h-9 px-3 text-sm w-full focus:outline-none" style={inputStyle}>
            <option value="">Select speciality</option>
            {specialities.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Photo (1:1, required)</label>
          {photo ? (
            <div className="relative w-20 h-20">
              <img src={photo} className="w-20 h-20 rounded-full object-cover" />
              <button type="button" onClick={() => setPhoto('')} className="absolute -top-1.5 -right-1.5 text-[10px] w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm">✕</button>
            </div>
          ) : (
            <label className="w-20 h-20 rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:opacity-80 transition" style={{ borderColor: theme?.input_border || '#e5e7eb' }}>
              <span className="text-lg leading-none" style={{ color: theme?.btn_bg || '#1e3a8a' }}>+</span>
              <span className="text-[10px]" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Add Photo</span>
              <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = '' }} />
            </label>
          )}
        </div>
        {!isEditing && <p className="text-[11px]" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Artists added by Admin are approved immediately.</p>}
        <div className="flex justify-end gap-2 mt-1">
          <button onClick={onClose} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }} className="px-4 py-2 text-sm">Cancel</button>
          <button disabled={!name.trim() || !photo || !specialityId || submitting} onClick={handleSubmit} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="px-4 py-2 text-sm disabled:opacity-40">{isEditing ? 'Save Changes' : 'Add Artist'}</button>
        </div>
      </div>
    </div>
  )
}
