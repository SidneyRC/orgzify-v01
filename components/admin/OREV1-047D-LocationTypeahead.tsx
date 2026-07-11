'use client'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type Location = { id: string; name: string; level: string; parent_id: string | null }

type Props = {
  label: string
  level: 'state' | 'district' | 'city'
  parent_id?: string | null
  country_id?: string | null
  value: { id: string; name: string } | null
  onChange: (val: { id: string; name: string } | null) => void
  error?: string
  required?: boolean
}

const API = '/admin/setup/companies/new/api'

export default function OREV1047DLocationTypeahead({ label, level, parent_id, country_id, value, onChange, error, required }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${error ? '#ef4444' : theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const dropStyle = { backgroundColor: theme?.dropdown_bg || '#fff', border: `1px solid ${theme?.dropdown_border || '#e5e7eb'}`, borderRadius: radius }

  const [query, setQuery] = useState(value?.name || '')
  const [results, setResults] = useState<Location[]>([])
  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => { setQuery(value?.name || '') }, [value])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = async (q: string) => {
    setQuery(q)
    onChange(null)
    if (q.length < 1) { setResults([]); setOpen(false); return }
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'search_locations', query: q, level, parent_id: parent_id || null })
    })
    const json = await res.json()
    setResults(json.data || [])
    setOpen(true)
  }

  const select = (loc: Location) => {
    onChange({ id: loc.id, name: loc.name })
    setQuery(loc.name)
    setOpen(false)
    setResults([])
  }

  const addNew = async () => {
    if (!query.trim()) return
    setAdding(true)
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'add_location', name: query.trim(), level, parent_id: parent_id || null, country_id: country_id || null })
    })
    const json = await res.json()
    if (json.data) { onChange({ id: json.data.id, name: json.data.name }); setQuery(json.data.name); setOpen(false) }
    setAdding(false)
  }

  const showAdd = query.trim().length > 0 && !results.find(r => r.name.toLowerCase() === query.trim().toLowerCase())

  return (
    <div className="flex flex-col gap-1" ref={ref}>
      <label className="text-xs text-gray-500">{label} {required && <span className="text-red-500">*</span>}</label>
      <div className="relative">
        <input
          value={query}
          onChange={e => search(e.target.value)}
          onFocus={() => { if (query.length > 0 && results.length > 0) setOpen(true) }}
          placeholder={`Search ${label.toLowerCase()}`}
          className="w-full h-10 px-3 text-sm focus:outline-none"
          style={inputStyle}
        />
        {open && (results.length > 0 || showAdd) && (
          <div className="absolute z-20 w-full mt-1 shadow-lg max-h-48 overflow-y-auto" style={dropStyle}>
            {results.map(r => (
              <div key={r.id}
                onMouseDown={e => { e.preventDefault(); select(r) }}
                className="px-3 py-2.5 text-sm cursor-pointer hover:bg-gray-50">
                {r.name}
              </div>
            ))}
            {showAdd && (
              <div onMouseDown={e => { e.preventDefault(); addNew() }}
                className="px-3 py-2.5 text-sm cursor-pointer text-blue-600 hover:bg-blue-50 font-medium border-t border-gray-100">
                {adding ? 'Adding…' : `+ Add "${query.trim()}"`}
              </div>
            )}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
