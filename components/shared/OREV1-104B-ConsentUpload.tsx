// THIS FILE GOES IN: components/shared/OREV1-104B-ConsentUpload.tsx (NEW FILE)
'use client'
import { useState, useRef } from 'react'

type Props = {
  accept: string; label: string; theme: any; radius: string
  onUpload: (file: File) => Promise<void>
}

export default function OREV1104BConsentUpload({ accept, label, theme, radius, onUpload }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [consent, setConsent] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }

  const handleUpload = async () => {
    if (!file || !consent) return
    setUploading(true)
    await onUpload(file)
    setUploading(false)
    setFile(null); setConsent(false)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div className="border border-dashed rounded-xl p-4 flex flex-col gap-3" style={{ borderColor: theme?.input_border || '#e5e7eb' }}>
      <input ref={inputRef} type="file" accept={accept} onChange={e => setFile(e.target.files?.[0] || null)} className="text-xs" />
      {file && (
        <label className="flex items-start gap-2 text-xs" style={{ color: theme?.color_text_muted || '#6b7280' }}>
          <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
          I confirm I own the rights to this content or have permission to use it, and grant Orgzify permission to display it.
        </label>
      )}
      <button onClick={handleUpload} disabled={!file || !consent || uploading} style={file && consent ? primaryBtn : outlineBtn}
        className="text-sm font-medium px-4 py-2 self-start disabled:opacity-50 transition">
        {uploading ? 'Uploading…' : label}
      </button>
    </div>
  )
}
