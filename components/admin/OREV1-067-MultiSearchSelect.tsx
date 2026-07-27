'use client'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type Option = { id: string; label: string }
type Props = { options: Option[]; values: string[]; onChange: (ids: string[]) => void; placeholder?: string; disabled?: boolean }

export default function OREV1067MultiSearchSelect({ options, values, onChange, placeholder = 'Search…', disabled }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const selected = options.filter(o => values.includes(o.id))
  const filtered = options.filter(o => o.label.toLowerCase().includes(term.toLowerCase()))
  const toggle = (id: string) => onChange(values.includes(id) ? values.filter(v => v !== id) : [...values, id])

  return (
    <div ref={boxRef}>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1.5">
          {selected.map(s => (
            <span key={s.id} className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 flex items-center gap-1">
              {s.label}
              {!disabled && <button type="button" onClick={() => toggle(s.id)} className="text-blue-400 hover:text-blue-600">✕</button>}
            </span>
          ))}
        </div>
      )}
      <div className="relative">
        <input
          value={term}
          onChange={e => { setTerm(e.target.value); setOpen(true) }}
          onFocus={() => setOpen(true)}
          placeholder={placeholder}
          disabled={disabled}
          className="h-10 px-3 text-sm w-full focus:outline-none disabled:opacity-50"
          style={inputStyle}
        />
        {open && !disabled && (
          <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white rounded-xl border border-gray-100 shadow-lg">
            {filtered.length === 0 && <p className="text-xs text-gray-400 px-3 py-2">No matches</p>}
            {filtered.map(o => (
              <label key={o.id} className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 cursor-pointer">
                <input type="checkbox" checked={values.includes(o.id)} onChange={() => toggle(o.id)} className="w-4 h-4 accent-blue-900" />
                {o.label}
              </label>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}