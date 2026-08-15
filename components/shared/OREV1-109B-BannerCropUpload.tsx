// THIS FILE GOES IN: components/shared/OREV1-109B-BannerCropUpload.tsx (NEW FILE)
'use client'
import { useState, useRef } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop, type Crop, type PixelCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

type Props = { file: File; onSave: (file: File) => void; onCancel: () => void; theme: any; aspect?: number; label?: string; requireConsent?: boolean }

function centerAspectCrop(width: number, height: number, aspect: number) {
  return centerCrop(makeAspectCrop({ unit: '%', width: 90 }, aspect, width, height), width, height)
}

export default function OREV1109BBannerCropUpload({ file, onSave, onCancel, theme, aspect = 2, label = 'Adjust banner crop (2:1 ratio)', requireConsent = false }: Props) {
  const [src] = useState(() => URL.createObjectURL(file))
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>()
  const [consent, setConsent] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerAspectCrop(width, height, aspect))
  }

  const handleSave = async () => {
    if (!completedCrop || !imgRef.current) return
    const img = imgRef.current
    const scaleX = img.naturalWidth / img.width
    const scaleY = img.naturalHeight / img.height
    const canvas = document.createElement('canvas')
    canvas.width = completedCrop.width * scaleX
    canvas.height = completedCrop.height * scaleY
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.drawImage(img, completedCrop.x * scaleX, completedCrop.y * scaleY, completedCrop.width * scaleX, completedCrop.height * scaleY, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(blob => {
      if (!blob) return
      onSave(new File([blob], file.name.replace(/\.[^.]+$/, '.jpg'), { type: 'image/jpeg' }))
    }, 'image/jpeg', 0.92)
  }

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl p-5 max-w-lg w-full flex flex-col gap-4">
        <p className="text-sm font-semibold text-gray-700">{label}</p>
        <div className="flex justify-center bg-gray-50 rounded-xl p-2">
          <ReactCrop crop={crop} onChange={c => setCrop(c)} onComplete={c => setCompletedCrop(c)} aspect={aspect} keepSelection>
            <img ref={imgRef} src={src} onLoad={onImageLoad} alt="Crop source" style={{ maxHeight: '60vh', maxWidth: '100%', display: 'block' }} />
          </ReactCrop>
        </div>
        {requireConsent && (
          <label className="flex items-start gap-2 text-xs" style={{ color: theme?.color_text_muted || '#6b7280' }}>
            <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5" />
            I confirm I own the rights to this content or have permission to use it, and grant Orgzify permission to display it.
          </label>
        )}
        <div className="flex justify-end gap-2">
          <button onClick={onCancel} style={outlineBtn} className="px-4 py-2 text-sm">✕ Cancel</button>
          <button onClick={handleSave} disabled={requireConsent && !consent} style={primaryBtn} className="px-4 py-2 text-sm disabled:opacity-40">Use this crop</button>
        </div>
      </div>
    </div>
  )
}
