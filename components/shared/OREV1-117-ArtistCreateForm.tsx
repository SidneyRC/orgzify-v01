// THIS FILE GOES IN: components/shared/OREV1-117-ArtistCreateForm.tsx (REPLACES existing file)
'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import OREV1109BBannerCropUpload from '@/components/shared/OREV1-109B-BannerCropUpload'
import OREV1117CArtistSocialLinks from '@/components/shared/OREV1-117C-ArtistSocialLinks'
const ARTISTS_API = '/biz/events/artists/api'
const UPLOAD_API = '/biz/events/artists/upload-photo/api'
type Speciality = { id: string; name: string }
type Props = { theme: any; onDone: () => void }

export default function OREV1117ArtistCreateForm({ theme, onDone }: Props) {
  const [name, setName] = useState('')
  const [photo, setPhoto] = useState('')
  const [cropFile, setCropFile] = useState<File | null>(null)
  const [specialities, setSpecialities] = useState<Speciality[]>([])
  const [specialityId, setSpecialityId] = useState('')
  const [newSpeciality, setNewSpeciality] = useState('')
  const [gender, setGender] = useState('')
  const [dob, setDob] = useState('')
  const [homeTown, setHomeTown] = useState('')
  const [country, setCountry] = useState('')
  const [social, setSocial] = useState<Record<string, string>>({})
  const [expanded, setExpanded] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }

  useEffect(() => { fetch(`${ARTISTS_API}?specialities=true`).then(r => r.json()).then(j => setSpecialities(j.data || [])) }, [])

  const handlePhotoSelect = async (f: File) => {
    const fd = new FormData(); fd.append('file', f)
    const res = await fetch(UPLOAD_API, { method: 'POST', body: fd })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Upload failed'); return }
    setPhoto(json.data.photo_url)
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    const res = await fetch(ARTISTS_API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'create_artist', name, photo_url: photo, speciality_id: specialityId || null,
        new_speciality_name: specialityId ? null : newSpeciality, gender: gender || null, dob: dob || null,
        home_town: homeTown || null, country: country || null, ...social
      })
    })
    const json = await res.json()
    setSubmitting(false)
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    toast.success('Submitted for Admin approval. It will be searchable once approved.')
    onDone()
  }

  const canSubmit = name.trim() && photo && (specialityId || newSpeciality.trim())

  return (
    <div className="flex flex-col gap-4">
      {cropFile && <OREV1109BBannerCropUpload file={cropFile} theme={theme} aspect={1} label="Adjust photo crop (1:1 ratio)" onCancel={() => setCropFile(null)} onSave={f => { setCropFile(null); handlePhotoSelect(f) }} />}
      <div className="flex flex-col items-center gap-1.5">
        {photo ? (
          <div className="relative" style={{ width: 88, height: 88 }}>
            <img src={photo} className="rounded-full object-cover" style={{ width: 88, height: 88 }} />
            <button type="button" onClick={() => setPhoto('')} className="absolute -top-1 -right-1 text-[10px] w-5 h-5 rounded-full bg-white border border-gray-200 shadow-sm">✕</button>
          </div>
        ) : (
          <label className="rounded-full border-2 border-dashed flex flex-col items-center justify-center gap-0.5 cursor-pointer hover:opacity-80 transition" style={{ borderColor: theme?.input_border || '#e5e7eb', width: 88, height: 88 }}>
            <span className="text-lg leading-none" style={{ color: theme?.btn_bg || '#1e3a8a' }}>+</span>
            <span className="text-[10px]" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Add Photo</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = '' }} />
          </label>
        )}
        <span className="text-[11px]" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Required</span>
      </div>

      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Artist name <span className="text-red-500">*</span></label>
        <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Ajith Kumar" className="h-9 px-3 text-sm w-full focus:outline-none" style={inputStyle} />
      </div>

      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Speciality <span className="text-red-500">*</span></label>
        <select value={specialityId} onChange={e => { setSpecialityId(e.target.value); setNewSpeciality('') }} className="h-9 px-3 text-sm w-full focus:outline-none" style={inputStyle}><option value="">Select or type new below</option>{specialities.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select>
        {!specialityId && <input value={newSpeciality} onChange={e => setNewSpeciality(e.target.value)} placeholder="Type a new speciality" className="h-9 px-3 text-sm w-full focus:outline-none mt-1.5" style={inputStyle} />}
      </div>

      <button type="button" onClick={() => setExpanded(!expanded)} className="flex items-center justify-between w-full px-3 py-2 text-xs" style={{ ...inputStyle, color: theme?.color_text_muted || '#9ca3af' }}>
        <span>Additional details (optional)</span><span>{expanded ? '▲' : '▼'}</span>
      </button>

      {expanded && (
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <select value={gender} onChange={e => setGender(e.target.value)} className="h-9 px-3 text-sm focus:outline-none" style={inputStyle}><option value="">Gender</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option></select>
            <input type="date" value={dob} onChange={e => setDob(e.target.value)} className="h-9 px-3 text-sm focus:outline-none" style={inputStyle} />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <input value={homeTown} onChange={e => setHomeTown(e.target.value)} placeholder="Home town" className="h-9 px-3 text-sm focus:outline-none" style={inputStyle} />
            <input value={country} onChange={e => setCountry(e.target.value)} placeholder="Country" className="h-9 px-3 text-sm focus:outline-none" style={inputStyle} />
          </div>
          <OREV1117CArtistSocialLinks values={social} onChange={(k, v) => setSocial({ ...social, [k]: v })} theme={theme} />
        </div>
      )}

      <p className="text-[11px]" style={{ color: theme?.color_text_muted || '#9ca3af' }}>New artists are reviewed by Admin before they can be added to any event.</p>
      <div className="flex gap-2">
        <button type="button" onClick={onDone} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }} className="flex-1 py-2 text-sm">Cancel</button>
        <button type="button" disabled={!canSubmit || submitting} onClick={handleSubmit} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="flex-1 py-2 text-sm disabled:opacity-40">Submit for approval</button>
      </div>
    </div>
  )
}
