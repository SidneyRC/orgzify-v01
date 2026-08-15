// GOES IN: components/admin/OREV1-094-EntityMultiSelect.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type EntityOption = { id: string; process_id: string; entity_unique_id: string | null; display_name: string }

type Props = {
  value: string[]
  selectedLabels: Record<string, string>
  onChange: (ids: string[], labels: Record<string, string>) => void
  apiBase: string
  error?: string
}

export default function OREV1094EntityMultiSelect({ value, selectedLabels, onChange, apiBase, error }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${error ? '#ef4444' : theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const dropStyle = { backgroundColor: theme?.dropdown_bg || '#fff', border: `1px solid ${theme?.dropdown_border || '#e5e7eb'}`, borderRadius: radius }
  const highlightBg = theme?.dropdown_hover_bg || '#f9fafb'
  const chipStyle = { backgroundColor: theme?.chip_bg || '#eff6ff', color: theme?.chip_text || '#1e3a8a', borderRadius: radius }

  const [query, setQuery] = useState('')
  const [results, setResults] = useState<EntityOption[]>([])
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
      const res = await fetch(`${apiBase}?type=search_entities&q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setResults((json.data || []).filter((e: EntityOption) => !value.includes(e.id)))
      setOpen(true)
    }, 250)
  }

  const add = (e: EntityOption) => {
    const label = `${e.entity_unique_id || e.process_id} | ${e.display_name}`
    onChange([...value, e.id], { ...selectedLabels, [e.id]: label })
    setQuery(''); setResults([]); setOpen(false); setActiveIndex(-1)
  }
  const remove = (id: string) => onChange(value.filter(v => v !== id), selectedLabels)

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + results.length) % results.length) }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeIndex >= 0) add(results[activeIndex]) }
    else if (e.key === 'Escape') { setOpen(false); setActiveIndex(-1) }
  }

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-xs text-gray-500">Entities <span className="text-red-500">*</span></label>

      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-1">
          {value.map(id => (
            <span key={id} style={chipStyle} className="text-xs px-2.5 py-1 flex items-center gap-1.5">
              {selectedLabels[id] || id}
              <button onClick={() => remove(id)} className="ml-0.5 hover:opacity-70">✕</button>
            </span>
          ))}
        </div>
      )}

      <div className="relative">
        <input value={query} onChange={e => search(e.target.value)} onKeyDown={handleKeyDown}
          placeholder="Search by Entity ID, Process ID or Name…" className="w-full h-10 px-3 text-sm focus:outline-none" style={inputStyle} />

        {open && results.length > 0 && (
          <div className="absolute z-20 w-full mt-1 shadow-lg max-h-48 overflow-y-auto" style={dropStyle}>
            {results.map((e, i) => (
              <div key={e.id} onMouseDown={ev => { ev.preventDefault(); add(e) }} onMouseEnter={() => setActiveIndex(i)}
                className="px-3 py-2.5 text-sm cursor-pointer" style={{ backgroundColor: activeIndex === i ? highlightBg : undefined }}>
                {e.entity_unique_id || e.process_id} | {e.display_name}
              </div>
            ))}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
