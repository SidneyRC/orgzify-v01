'use client'

type Props = { mode: 'qr' | 'upi'; fields: any; setFields: (f: any) => void; upi: any[]; setUpi: (u: any[]) => void; eventId: string; locked: boolean; onToggle: () => void; theme: any }

export default function OREV1113BBookingQRUPI({ mode, fields, setFields, upi, setUpi, eventId, locked, onToggle, theme }: Props) {
  const enabled = mode === 'qr' ? fields.qr_enabled : fields.upi_enabled
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const labelStyle = { color: theme?.color_text_muted || '#9ca3af' }
  const toggleBg = enabled ? (theme?.toggle_on || '#22c55e') : (theme?.toggle_off || '#e5e7eb')

  const handleQRUpload = async (file: File) => {
    const form = new FormData(); form.append('file', file); form.append('event_id', eventId)
    const res = await fetch('/biz/events/eventvenue/bookingmethod/upload-qr/api', { method: 'POST', body: form })
    const j = await res.json()
    if (j.url) setFields((f: any) => ({ ...f, qr_image_url: j.url }))
  }
  const updateUpi = (i: number, key: string, val: string) => { const next = [...upi]; next[i] = { ...next[i], [key]: val }; setUpi(next) }
  const addUpi = () => setUpi([...upi, { upi_id: '', display_name: '', provider: '' }])
  const removeUpi = (i: number) => setUpi(upi.filter((_, idx) => idx !== i))

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button type="button" disabled={locked} onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <p className="text-sm font-semibold text-gray-700">{mode === 'qr' ? 'QR Code' : 'UPI'}</p>
        <span className="relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0" style={{ backgroundColor: toggleBg }}>
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </span>
      </button>

      {enabled && mode === 'qr' && (
        <div className="px-6 pb-6 border-t border-gray-50 pt-5">
          <label className="text-xs font-medium block mb-1" style={labelStyle}>QR image</label>
          <div className="flex gap-3 items-center">
            <label className="w-16 h-16 rounded-xl border-2 border-dashed flex items-center justify-center flex-shrink-0 cursor-pointer hover:opacity-80 transition" style={{ borderColor: theme?.input_border || '#e5e7eb' }}>
              <input type="file" accept="image/*" disabled={locked} hidden onChange={e => e.target.files?.[0] && handleQRUpload(e.target.files[0])} />
              {fields.qr_image_url ? <img src={fields.qr_image_url} alt="QR" className="w-full h-full object-contain rounded-xl" /> : <span className="text-xl" style={{ color: theme?.btn_bg || '#1e3a8a' }}>+</span>}
            </label>
            <p className="text-xs" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Click to upload QR image<br />PNG or JPG, up to 2MB</p>
          </div>
          <label className="text-xs font-medium block mt-4 mb-1" style={labelStyle}>Display name</label>
          <input placeholder="e.g. Scan to pay" disabled={locked} value={fields.qr_display_name || ''} onChange={e => setFields((f: any) => ({ ...f, qr_display_name: e.target.value }))} className="h-10 px-3 text-sm focus:outline-none w-full" style={inputStyle} />
        </div>
      )}

      {enabled && mode === 'upi' && (
        <div className="px-6 pb-6 border-t border-gray-50 pt-5">
          {upi.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-1">
              <label className="text-xs font-medium" style={labelStyle}>UPI ID</label>
              <label className="text-xs font-medium" style={labelStyle}>Provider</label>
              <label className="text-xs font-medium" style={labelStyle}>Display name</label>
              <span />
            </div>
          )}
          {upi.map((u, i) => (
            <div key={i} className="grid grid-cols-1 sm:grid-cols-4 gap-2 mb-2 items-center">
              <input placeholder="UPI ID" disabled={locked} value={u.upi_id} onChange={e => updateUpi(i, 'upi_id', e.target.value)} className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
              <input placeholder="e.g. GPay" disabled={locked} value={u.provider} onChange={e => updateUpi(i, 'provider', e.target.value)} className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
              <input placeholder="Display Name" disabled={locked} value={u.display_name} onChange={e => updateUpi(i, 'display_name', e.target.value)} className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
              {!locked && <button onClick={() => removeUpi(i)} title="Remove" className="justify-self-start"><svg width="16" height="16" fill="none" stroke="red" viewBox="0 0 24 24"><path strokeWidth="2" d="M6 6l12 12M6 18L18 6" /></svg></button>}
            </div>
          ))}
          {!locked && <button onClick={addUpi} className="text-xs font-medium mt-1" style={{ color: theme?.btn_bg || '#1e3a8a' }}>+ Add another UPI</button>}
        </div>
      )}
    </div>
  )
}
