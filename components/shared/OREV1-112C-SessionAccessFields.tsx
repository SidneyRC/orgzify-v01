// THIS FILE GOES IN: components/shared/OREV1-112C-SessionAccessFields.tsx (REPLACES EXISTING)
'use client'

type Props = { link: string; password: string; locked: boolean; theme: any; onChange: (field: 'link' | 'password', v: string) => void }

// Access Link and Password for one session, stacked on two lines so a long
// pasted link stays inside the box (break-all) instead of stretching the
// layout — same fix used for long URLs/IDs elsewhere (Section 3, item 6).
// No Save here: Continue on the Schedule step saves every changed session.
export default function OREV1112CSessionAccessFields({ link, password, locked, theme, onChange }: Props) {
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius, wordBreak: 'break-all' as const }

  return (
    <div className="flex flex-col gap-2 pl-1 pb-2">
      <input placeholder="Access link" disabled={locked} value={link} onChange={e => onChange('link', e.target.value)} className="h-9 px-3 text-xs w-full break-all" style={inputStyle} />
      <input placeholder="Password" disabled={locked} value={password} onChange={e => onChange('password', e.target.value)} className="h-9 px-3 text-xs w-full" style={inputStyle} />
    </div>
  )
}
