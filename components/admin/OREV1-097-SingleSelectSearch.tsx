// GOES IN: components/admin/OREV1-097-SingleSelectSearch.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type Option = { id: string; display_name: string }

type Props = {
  value: string
  label: string
  onChange: (id: string, label: string) => void
  apiBase: string
  apiType: string
  placeholder: string
}

export default function OREV1097SingleSelectSearch({ value, label, onChange, apiBase, apiType, placeholder }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const dropStyle = { backgroundColor: theme?.dropdown_bg || '#fff', border: `1px solid ${theme?.dropdown_border || '#e5e7eb'}`, borderRadius: radius }
  const highlightBg = theme?.dropdown_hover_bg || '#f9fafb'

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Option[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = (q: string) => {
    setQuery(q); setActiveIndex(-1)
    if (timer.current) clearTimeout(timer.current)
    if (q.length < 1) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      const res = await fetch(`${apiBase}?type=${apiType}&q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setResults(json.data || [])
      setOpen(true)
    }, 250)
  }

  const pick = (o: Option) => { onChange(o.id, o.display_name); setQuery(''); setResults([]); setOpen(false); setActiveIndex(-1) }
  const clear = () => { onChange('', ''); setQuery('') }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + results.length) % results.length) }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeIndex >= 0) pick(results[activeIndex]) }
    else if (e.key === 'Escape') { setOpen(false); setActiveIndex(-1) }
  }

  return (
    <div className="relative" ref={ref}>
      {value ? (
        <div className="w-full h-10 px-3 text-sm flex items-center justify-between" style={inputStyle}>
          <span className="truncate">{label}</span>
          <button onClick={clear} className="ml-2 text-gray-400 hover:text-gray-600 shrink-0">✕</button>
        </div>
      ) : (
        <input value={query} onChange={e => search(e.target.value)} onFocus={() => query && setOpen(true)} onKeyDown={handleKeyDown}
          placeholder={placeholder} className="w-full h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
      )}

      {open && !value && results.length > 0 && (
        <div className="absolute z-20 w-full mt-1 shadow-lg max-h-48 overflow-y-auto" style={dropStyle}>
          {results.map((o, i) => (
            <div key={o.id} onMouseDown={ev => { ev.preventDefault(); pick(o) }} onMouseEnter={() => setActiveIndex(i)}
              className="px-3 py-2.5 text-sm cursor-pointer" style={{ backgroundColor: activeIndex === i ? highlightBg : undefined }}>
              {o.display_name}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
