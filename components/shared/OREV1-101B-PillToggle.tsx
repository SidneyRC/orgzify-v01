// THIS FILE GOES IN: components/shared/OREV1-101B-PillToggle.tsx (NEW FILE)
'use client'
import { Theme } from '@/lib/ThemeContext'

type Props = {
  value: string
  options: { value: string; label: string }[]
  onChange: (v: string) => void
  theme: Theme | null
  radius: string
}

export default function OREV1101BPillToggle({ value, options, onChange, theme, radius }: Props) {
  const activePill = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const inactivePill = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  return (
    <div className="flex gap-2">
      {options.map(opt => (
        <button key={opt.value} type="button" onClick={() => onChange(opt.value)}
          style={value === opt.value ? activePill : inactivePill}
          className="text-sm font-medium px-4 py-2 flex-1 sm:flex-none">
          {opt.label}
        </button>
      ))}
    </div>
  )
}
