// GOES IN: components/admin/OREV1-096-LocationSearch.tsx
'use client'
import { useState, useRef, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type Result = { display_name: string; lat: string; lon: string }
type Props = {
  latitude: number | null; longitude: number | null; displayName: string
  onChange: (lat: number | null, lon: number | null, displayName: string) => void
  apiBase: string; error?: string
}

export default function OREV1096LocationSearch({ latitude, longitude, displayName, onChange, apiBase, error }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${error ? '#ef4444' : theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const dropStyle = { backgroundColor: theme?.dropdown_bg || '#fff', border: `1px solid ${theme?.dropdown_border || '#e5e7eb'}`, borderRadius: radius }
  const highlightBg = theme?.dropdown_hover_bg || '#f9fafb'

  const [query, setQuery] = useState(displayName || '')
  const [results, setResults] = useState<Result[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => { setQuery(displayName || '') }, [displayName])
  useEffect(() => {
    const handleClick = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false) }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const search = (q: string) => {
    setQuery(q); setActiveIndex(-1)
    if (timer.current) clearTimeout(timer.current)
    if (q.length < 3) { setResults([]); setOpen(false); return }
    timer.current = setTimeout(async () => {
      const res = await fetch(`${apiBase}?type=search_location&q=${encodeURIComponent(q)}`)
      const json = await res.json()
      setResults(json.data || []); setOpen(true)
    }, 400)
  }

  const select = (r: Result) => {
    onChange(parseFloat(r.lat), parseFloat(r.lon), r.display_name)
    setQuery(r.display_name); setResults([]); setOpen(false); setActiveIndex(-1)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + results.length) % results.length) }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeIndex >= 0) select(results[activeIndex]) }
    else if (e.key === 'Escape') { setOpen(false); setActiveIndex(-1) }
  }

  const hasPin = latitude != null && longitude != null
  const bbox = hasPin ? `${longitude! - 0.005},${latitude! - 0.004},${longitude! + 0.005},${latitude! + 0.004}` : ''
  const mapSrc = hasPin ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&marker=${latitude},${longitude}` : ''

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
      <div className="flex flex-col gap-1" ref={ref}>
        <label className="text-xs text-gray-500">Search Location</label>
        <div className="relative">
          <input value={query} onChange={e => search(e.target.value)} onKeyDown={handleKeyDown}
            placeholder="Type an address or area…" className="w-full h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
          {open && results.length > 0 && (
            <div className="absolute z-20 w-full mt-1 shadow-lg max-h-48 overflow-y-auto" style={dropStyle}>
              {results.map((r, i) => (
                <div key={i} onMouseDown={e => { e.preventDefault(); select(r) }} onMouseEnter={() => setActiveIndex(i)}
                  className="px-3 py-2.5 text-sm cursor-pointer" style={{ backgroundColor: activeIndex === i ? highlightBg : undefined }}>
                  {r.display_name}
                </div>
              ))}
            </div>
          )}
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
        {hasPin && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Pin set at {latitude!.toFixed(5)}, {longitude!.toFixed(5)}</span>
            <button onClick={() => { onChange(null, null, ''); setQuery('') }} className="text-xs text-red-600 bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-full font-medium transition">✕ Clear</button>
          </div>
        )}
      </div>

      <div className="h-40 overflow-hidden border border-gray-100" style={{ borderRadius: radius }}>
        {hasPin ? (
          <iframe src={mapSrc} className="w-full h-full" style={{ border: 0 }} loading="lazy" />
        ) : (
          <div className="flex items-center justify-center h-full text-xs text-gray-400">Search and pick a location to preview the pin</div>
        )}
      </div>
    </div>
  )
}
