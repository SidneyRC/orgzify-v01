// THIS FILE GOES IN: components/shared/OREV1-111-EventStepVenue.tsx (REPLACES existing file)
'use client'
import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

const API = '/biz/events/eventvenue/api'
type Venue = { id: string; external_name: string; line1: string; area: string; pincode: string; city_name: string; state_name: string; country_name: string }
type Selected = { id: string; venue_id: string; venue: Venue }
type Props = { eventId: string; entityId: string; entitySlug: string; processId: string; locked: boolean; onContinue: () => void; onBack: () => void; onClose: () => void }

export default function OREV1111EventStepVenue({ eventId, entityId, entitySlug, processId, locked, onContinue, onBack, onClose }: Props) {
  const { theme } = useTheme()
  const router = useRouter()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const dropStyle = { backgroundColor: theme?.dropdown_bg || '#fff', border: `1px solid ${theme?.dropdown_border || '#e5e7eb'}`, borderRadius: radius }
  const cardStyle = { borderColor: theme?.input_border || '#e5e7eb', backgroundColor: theme?.input_bg || '#fff', borderRadius: radius }
  const highlightBg = theme?.dropdown_hover_bg || '#f9fafb'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [selected, setSelected] = useState<Selected[]>([])
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Venue[]>([])
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const ref = useRef<HTMLDivElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const load = () => { fetch(`${API}?event_id=${eventId}`).then(r => r.json()).then(j => { console.log('VENUE LOAD RESULT:', j); setSelected(j.selected || []); setLoading(false) }) }
  useEffect(load, [eventId])

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
      const res = await fetch(`${API}?type=search_venues&entity_id=${entityId}&q=${encodeURIComponent(q)}`)
      const json = await res.json()
      const already = selected.map(s => s.venue_id)
      setResults((json.data || []).filter((v: Venue) => !already.includes(v.id)))
      setOpen(true)
    }, 250)
  }

  const add = async (v: Venue) => {
    setQuery(''); setResults([]); setOpen(false); setActiveIndex(-1); setError('')
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'add_venue', event_id: eventId, venue_id: v.id }) })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Venue added')
    load()
  }

  const remove = async (id: string) => {
    const res = await fetch(API, { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const json = await res.json()
    if (json.error) { toast.error(json.error); return }
    toast.success('Venue removed')
    load()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIndex(i => (i + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIndex(i => (i - 1 + results.length) % results.length) }
    else if (e.key === 'Enter') { e.preventDefault(); if (activeIndex >= 0) add(results[activeIndex]) }
    else if (e.key === 'Escape') { setOpen(false); setActiveIndex(-1) }
  }

  const handleContinue = () => { if (selected.length === 0) { setError('Select at least one venue'); return } onContinue() }
  const goAddVenue = () => router.push(`/biz/${entitySlug}/events/eventvenue/new?ref=${processId}`)

  const AddressLines = ({ v }: { v: Venue }) => (
    <>
      <p className="text-sm font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>{v.external_name}</p>
      <p className="text-xs mt-0.5" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{v.line1}</p>
      <p className="text-xs" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{v.area} - {v.city_name}</p>
      <p className="text-xs" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{v.state_name} {v.pincode} - {v.country_name}</p>
    </>
  )

  if (loading) return <p className="text-sm text-gray-400">Loading…</p>

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {locked && <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700">This event is awaiting Admin review and can't be edited right now.</div>}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <h2 className="text-lg font-semibold mb-1" style={{ color: theme?.color_text_primary || '#111827' }}>Select Venue(s)</h2>
          <p className="text-sm" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Search and add one or more venues for this event.</p>
        </div>
        {!locked && <button onClick={goAddVenue} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 transition shrink-0">+ Add New Venue</button>}
      </div>

      <fieldset disabled={locked} className="flex flex-col gap-3 disabled:opacity-60" ref={ref}>
        <div className="relative">
          <input value={query} onChange={e => search(e.target.value)} onKeyDown={handleKeyDown} placeholder="Search venue by name…" className="w-full h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
          {open && results.length > 0 && (
            <div className="absolute z-20 w-full mt-1 shadow-lg max-h-72 overflow-y-auto" style={dropStyle}>
              {results.map((v, i) => (
                <div key={v.id} onMouseDown={e => { e.preventDefault(); add(v) }} onMouseEnter={() => setActiveIndex(i)} className="px-3 py-2.5 cursor-pointer border-b last:border-0" style={{ backgroundColor: activeIndex === i ? highlightBg : undefined, borderColor: theme?.input_border || '#f3f4f6' }}>
                  <AddressLines v={v} />
                </div>
              ))}
            </div>
          )}
        </div>

        {selected.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {selected.map(s => (
              <div key={s.id} className="relative border p-3" style={cardStyle}>
                <button onClick={() => remove(s.id)} className="absolute top-2 right-2 text-xs text-red-500">✕</button>
                <AddressLines v={s.venue} />
              </div>
            ))}
          </div>
        )}
      </fieldset>
      {error && <span className="text-xs text-red-500">{error}</span>}

      <div className="flex justify-end gap-2">
        <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">← Back</button>
        <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">✕ Close</button>
        {!locked && <button onClick={handleContinue} style={primaryBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">Continue</button>}
      </div>
    </div>
  )
}
