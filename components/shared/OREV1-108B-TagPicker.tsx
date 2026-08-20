// THIS FILE GOES IN: components/shared/OREV1-108B-TagPicker.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'

const API = '/biz/events/api'
type Tag = { id: string; name: string }
type Props = { eventId: string | null | undefined; locked: boolean; theme: any; value: Tag[]; onChange: (tags: Tag[]) => void; error?: string }

export default function OREV1108BTagPicker({ eventId, locked, theme, value, onChange, error }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Tag[]>([])
  const [max, setMax] = useState(3)
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }

  useEffect(() => {
    fetch(`${API}?type=tag_settings`).then(r => r.json()).then(j => setMax(j.max || 3))
  }, [])

  useEffect(() => {
    if (!eventId || value.length) return
    fetch(`${API}?type=event_tags&event_id=${eventId}`).then(r => r.json()).then(j => { if (j.data?.length) onChange(j.data) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  const runSearch = async (val: string) => {
    setQ(val)
    if (!val.trim()) { setResults([]); return }
    const res = await fetch(`${API}?type=tags_search&q=${encodeURIComponent(val)}`)
    const json = await res.json()
    setResults((json.data || []).filter((t: Tag) => !value.some(v => v.id === t.id)))
  }

  const addTag = (tag: Tag) => {
    if (value.length >= max) return
    onChange([...value, tag])
    setQ('')
    setResults([])
  }

  const removeTag = (id: string) => onChange(value.filter(t => t.id !== id))

  const atMax = value.length >= max

  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">Tags <span className="text-red-500">*</span></label>

      <div className="flex flex-wrap gap-2 mb-1">
        {value.map(t => (
          <span key={t.id} className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full" style={{ backgroundColor: theme?.badge_success_bg || '#eff6ff', color: theme?.color_text_primary || '#111827' }}>
            {t.name}
            {!locked && <button type="button" onClick={() => removeTag(t.id)} className="text-xs opacity-60 hover:opacity-100">✕</button>}
          </span>
        ))}
      </div>

      {!locked && !atMax && (
        <div className="relative">
          <input value={q} onChange={e => runSearch(e.target.value)} placeholder="Search tags..." className="h-10 px-3 text-sm w-full focus:outline-none" style={inputStyle} />
          {q.trim() && (
            <div className="absolute z-10 mt-1 w-full border border-gray-100 rounded-xl bg-white max-h-40 overflow-y-auto shadow-sm">
              {results.map(t => (
                <button key={t.id} type="button" onClick={() => addTag(t)} className="w-full text-left text-sm px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0">
                  {t.name}
                </button>
              ))}
              {results.length === 0 && <p className="text-xs px-3 py-2" style={{ color: theme?.color_text_muted || '#9ca3af' }}>No matching tags</p>}
            </div>
          )}
        </div>
      )}

      {atMax && !locked && <span className="text-xs" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Maximum {max} tags</span>}
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  )
}
