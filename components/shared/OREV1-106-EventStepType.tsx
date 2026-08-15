// THIS FILE GOES IN: components/shared/OREV1-106-EventStepType.tsx (NEW FILE)
'use client'
import { useTheme } from '@/lib/ThemeContext'

type Props = { value: string; locked: boolean; onChange: (v: string) => void; onContinue: () => void; onClose: () => void }

const OPTS = [
  { value: 'physical', label: 'Physical', note: "Happens at a real venue — you'll pick the venue, date and time later." },
  { value: 'virtual', label: 'Virtual', note: "Happens online — you'll provide an access link and password instead of a venue." },
]

export default function OREV1106EventStepType({ value, locked, onChange, onContinue, onClose }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const activeCard = { borderColor: theme?.btn_bg || '#1e3a8a', backgroundColor: theme?.badge_success_bg || '#eff6ff', borderRadius: radius }
  const inactiveCard = { borderColor: theme?.input_border || '#e5e7eb', backgroundColor: theme?.input_bg || '#fff', borderRadius: radius }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      <div>
        <h2 className="text-lg font-semibold mb-1" style={{ color: theme?.color_text_primary || '#111827' }}>What kind of event is this?</h2>
        <p className="text-sm" style={{ color: theme?.color_text_muted || '#9ca3af' }}>This decides which steps come next.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {OPTS.map(opt => (
          <button key={opt.value} type="button" disabled={locked} onClick={() => onChange(opt.value)}
            style={value === opt.value ? activeCard : inactiveCard} className="text-left border p-5 transition disabled:opacity-70">
            <p className="text-base font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>{opt.label}</p>
            <p className="text-sm mt-1.5" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{opt.note}</p>
          </button>
        ))}
      </div>
      {locked && <p className="text-xs" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Event type is locked once the event is created.</p>}

      <div className="flex justify-end gap-2">
        <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">✕ Close</button>
        <button onClick={onContinue} disabled={!value} style={primaryBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition disabled:opacity-50">Continue</button>
      </div>
    </div>
  )
}
