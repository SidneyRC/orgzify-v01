  // THIS FILE GOES IN: components/shared/OREV1-145-PagesLogoBox.tsx (NEW FILE)
  'use client'
  import { useState, useEffect } from 'react'
  import toast from 'react-hot-toast'
  import OREV1109BBannerCropUpload from '@/components/shared/OREV1-109B-BannerCropUpload'

  const API = '/biz/pages/api'
  const UPLOAD_API = '/biz/events/sponsors/upload-logo/api'
  type Info = { status: string; logo_url: string | null; reason: string | null; pending_url?: string | null }
  const LABELS: Record<string, string> = { pending: 'Approval Pending', approved: 'Approved', rejected: 'Rejected' }

  export default function OREV1145PagesLogoBox({ entityId, theme }: { entityId: string; theme: any }) {
    const [info, setInfo] = useState<Info>({ status: 'none', logo_url: null, reason: null })
    const [cropFile, setCropFile] = useState<File | null>(null)
    const [busy, setBusy] = useState(false); const [loaded, setLoaded] = useState(false)
    const radius = theme?.global_border_radius || '12px'
    const muted = theme?.color_text_muted || '#9ca3af'
    const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
    const badges: Record<string, any> = {
      pending: { backgroundColor: theme?.badge_warning_bg || '#fef9c3', color: theme?.badge_warning_text || '#a16207' },
      approved: { backgroundColor: theme?.badge_success_bg || '#dcfce7', color: theme?.badge_success_text || '#15803d' },
      rejected: { backgroundColor: theme?.badge_error_bg || '#fee2e2', color: theme?.badge_error_text || '#b91c1c' },
    }

    const notify = (d: Info) => {
      try {
        const key = `logo_seen_${entityId}`
        const prev = JSON.parse(localStorage.getItem(key) || 'null')
        if (prev && prev.status === 'pending' && d.status === 'approved') toast.success('Your logo has been approved')
        else if (prev && prev.status === 'pending' && d.status === 'rejected') toast.error(`Your logo was not approved${d.reason ? ': ' + d.reason : ''}`)
        else if (prev && prev.pending && !d.pending_url && d.status === 'approved') {
          if (d.reason) toast.error(`Your logo change was not approved: ${d.reason}`)
          else toast.success('Your logo change has been approved')
        }
        localStorage.setItem(key, JSON.stringify({ status: d.status, pending: !!d.pending_url }))
      } catch {}
    }
    const load = () => fetch(`${API}?entity_id=${entityId}`).then(r => r.json()).then(j => { if (j.data) { setInfo(j.data); notify(j.data) } setLoaded(true) }).catch(() => setLoaded(true))
    useEffect(() => { load() }, [entityId])

    const post = (body: any) => fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ entity_id: entityId, ...body }) })

    const handleCropped = async (f: File) => {
      setCropFile(null); setBusy(true)
      const fd = new FormData(); fd.append('file', f)
      const up = await fetch(UPLOAD_API, { method: 'POST', body: fd }); const upJson = await up.json()
      if (!up.ok) { toast.error(upJson.error || 'Upload failed'); setBusy(false); return }
      const res = await post({ action: 'save_logo', logo_url: upJson.data.logo_url }); const json = await res.json()
      setBusy(false)
      if (!res.ok) { toast.error(json.error || 'Failed'); return }
      toast.success('Logo submitted for Admin approval'); load()
    }

    const handleRemove = async () => {
      if (!confirm('Remove this logo?')) return
      const res = await post({ action: 'remove_logo' }); const json = await res.json()
      if (!res.ok) { toast.error(json.error || 'Failed'); return }
      setInfo({ status: 'none', logo_url: null, reason: null })
    }

    const handleCancelChange = async () => {
      localStorage.removeItem(`logo_seen_${entityId}`)
      const res = await post({ action: 'cancel_change' })
      if (!res.ok) { toast.error('Failed'); return }
      load()
    }

    const picker = <input type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) setCropFile(f); e.target.value = '' }} />
    const editable = info.status === 'pending' || info.status === 'rejected'; if (!loaded) return <p className="text-sm" style={{ color: muted }}>Loading…</p>

    return (
      <div className="bg-white border border-gray-100 p-5" style={{ borderRadius: radius }}>
        {cropFile && <OREV1109BBannerCropUpload file={cropFile} theme={theme} aspect={1} label="Adjust logo crop (1:1 ratio)" onCancel={() => setCropFile(null)} onSave={handleCropped} />}
        <div className="flex gap-4 items-center">
          {info.logo_url ? <img src={info.logo_url} alt="Logo" className="w-24 h-24 object-cover shrink-0" style={{ borderRadius: radius }} /> : (
            <label className="w-24 h-24 shrink-0 border-2 border-dashed flex flex-col items-center justify-center cursor-pointer hover:opacity-80" style={{ borderRadius: radius, borderColor: theme?.input_border || '#e5e7eb', color: muted }}>
              <span className="text-xl leading-none">+</span><span className="text-xs">{busy ? 'Saving…' : 'Add logo'}</span>{picker}
            </label>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <p className="font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Logo</p>
              {LABELS[info.status] && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={badges[info.status]}>{LABELS[info.status]}</span>}
              {info.pending_url && <span className="text-xs px-2.5 py-1 rounded-full font-medium" style={badges.pending}>Change Pending</span>}
            </div>
            <p className="text-xs mb-2" style={{ color: muted }}>
              1:1 or 300 × 300 px
              
            </p>
            {info.status === 'approved' && (
              <div className="flex gap-2">
                {info.pending_url
                  ? <button type="button" onClick={handleCancelChange} style={outlineBtn} className="text-sm px-4 py-1.5 hover:opacity-90">Cancel change</button>
                  : <label style={outlineBtn} className="text-sm px-4 py-1.5 cursor-pointer hover:opacity-90">Change{picker}</label>}
              </div>
            )}
            {editable && (
              <div className="flex gap-2">
                <label style={outlineBtn} className="text-sm px-4 py-1.5 cursor-pointer hover:opacity-90">Change logo{picker}</label>
                <button type="button" onClick={handleRemove} style={outlineBtn} className="text-sm px-4 py-1.5 hover:opacity-90">Remove</button>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }