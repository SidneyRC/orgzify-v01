'use client'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type Option = { id: string; label: string }
type Props = {
  options: Option[]
  value: string
  onChange: (id: string) => void
  placeholder?: string
  disabled?: boolean
}

export default function OREV1065SearchSelect({ options, value, onChange, placeholder = 'Search…', disabled }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const [open, setOpen] = useState(false)
  const [term, setTerm] = useState('')
  const boxRef = useRef<HTMLDivElement>(null)

  const selected = options.find(o => o.id === value)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => { if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const filtered = options.filter(o => o.label.toLowerCase().includes(term.toLowerCase()))

  return (
    <div className="relative" ref={boxRef}>
      <input
        value={open ? term : (selected?.label || '')}
        onChange={e => { setTerm(e.target.value); setOpen(true) }}
        onFocus={() => { setTerm(''); setOpen(true) }}
        placeholder={placeholder}
        disabled={disabled}
        className="h-10 px-3 text-sm w-full focus:outline-none disabled:opacity-50"
        style={inputStyle}
      />
      {open && !disabled && (
        <div className="absolute z-10 mt-1 w-full max-h-48 overflow-y-auto bg-white rounded-xl border border-gray-100 shadow-lg">
          {filtered.length === 0 && <p className="text-xs text-gray-400 px-3 py-2">No matches</p>}
          {filtered.map(o => (
            <button key={o.id} type="button" onClick={() => { onChange(o.id); setTerm(''); setOpen(false) }}
              className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">{o.label}</button>
          ))}
        </div>
      )}
    </div>
  )
}