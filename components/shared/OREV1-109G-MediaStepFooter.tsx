// THIS FILE GOES IN: components/shared/OREV1-109G-MediaStepFooter.tsx (REPLACES existing file)
'use client'

type Props = { locked: boolean; onBack: () => void; onClose: () => void; onContinue: () => void; theme: any }

export default function OREV1109GMediaStepFooter({ locked, onBack, onClose, onContinue, theme }: Props) {
  const radius = theme?.global_border_radius || '12px'
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }

  return (
    <div className="flex justify-end gap-2">
      <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">← Back</button>
      <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">✕ Close</button>
      <button onClick={onContinue} style={primaryBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">{locked ? 'Next →' : 'Continue'}</button>
    </div>
  )
}