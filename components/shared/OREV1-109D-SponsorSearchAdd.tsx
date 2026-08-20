// THIS FILE GOES IN: components/shared/OREV1-109D-SponsorSearchAdd.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
import OREV1116SponsorCreateForm from '@/components/shared/OREV1-116-SponsorCreateForm'
const SPONSORS_API = '/biz/events/sponsors/api'
const TYPE_SUGGESTIONS = ['Title Sponsor', 'Presenting Sponsor', 'Venue Partner', 'Official Ticketing Partner', 'Media Partner', 'Hospitality Partner', 'Beverage Partner', 'Merchandise Partner']
type Sponsor = { id: string; name: string; logo_url: string | null }
type Props = { locked: boolean; theme: any; onAssign: (sponsor: Sponsor, sponsorType: string) => void }

function Field({ label, children, theme }: { label: string; children: any; theme: any }) {
  return <div><label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{label}</label>{children}</div>
}

export default function OREV1109DSponsorSearchAdd({ locked, theme, onAssign }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Sponsor[]>([])
  const [selected, setSelected] = useState<Sponsor | null>(null)
  const [sponsorType, setSponsorType] = useState('')
  const [typeFocused, setTypeFocused] = useState(false)
  const [creating, setCreating] = useState(false)
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null)
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const typeMatches = TYPE_SUGGESTIONS.filter(t => t.toLowerCase().includes(sponsorType.toLowerCase()))

  useEffect(() => {
    if (!zoomedUrl) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setZoomedUrl(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [zoomedUrl])

  const runSearch = async (val: string) => {
    setQ(val); setSelected(null)
    if (!val.trim()) { setResults([]); return }
    const res = await fetch(`${SPONSORS_API}?search=${encodeURIComponent(val)}`)
    const json = await res.json()
    setResults(json.data || [])
  }


  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <Field label="Search sponsor by name" theme={theme}>
        <div className="flex gap-2">
          <input disabled={locked} value={q} onChange={e => runSearch(e.target.value)} placeholder="Type a sponsor name" className="h-9 px-3 text-sm flex-1 focus:outline-none" style={inputStyle} />
          {!locked && <button type="button" onClick={() => setCreating(true)} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="px-4 text-sm shrink-0">+ Add</button>}
        </div>
      </Field>
      {q.trim() && !selected && (
        <div className="mt-1 border border-gray-100 rounded-xl max-h-40 overflow-y-auto">
          {results.map(s => (
            <button key={s.id} type="button" onClick={() => { setSelected(s); setQ(s.name); setResults([]) }} className="w-full flex items-center gap-3 text-left text-sm px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
              {s.logo_url ? (
                <div className="relative w-14 h-14 shrink-0" onClick={e => { e.stopPropagation(); setZoomedUrl(s.logo_url) }}>
                  <img src={s.logo_url} className="w-14 h-14 rounded-full object-cover cursor-zoom-in" />
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[9px]">🔍</span>
                </div>
              ) : <span className="w-14 h-14 rounded-full bg-gray-100 shrink-0" />}
              {s.name}
            </button>
          ))}
          {results.length === 0 && <p className="text-xs px-3 py-2" style={{ color: theme?.color_text_muted || '#9ca3af' }}>No match. You can create a new sponsor.</p>}
        </div>
      )}
      {selected && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm relative" onClick={e => e.stopPropagation()}>
            <p className="text-sm font-semibold text-gray-700 mb-3">{selected.name}</p>
            <Field label="Sponsor type" theme={theme}><input disabled={locked} value={sponsorType} onChange={e => setSponsorType(e.target.value)} onFocus={() => setTypeFocused(true)} onBlur={() => setTimeout(() => setTypeFocused(false), 150)} placeholder="e.g. Title Sponsor" className="h-9 px-3 text-sm w-full focus:outline-none" style={inputStyle} /></Field>
            {typeFocused && typeMatches.length > 0 && (
              <div className="mt-1 border border-gray-100 rounded-xl bg-white max-h-40 overflow-y-auto shadow-sm">
                {typeMatches.map(t => (
                  <button key={t} type="button" onMouseDown={() => setSponsorType(t)} className="w-full text-left text-sm px-3 py-2 hover:bg-gray-50 border-b border-gray-50 last:border-0">{t}</button>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 mt-4">
              <button type="button" onClick={() => { setSelected(null); setQ(''); setSponsorType('') }} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }} className="px-4 py-2 text-sm">Cancel</button>
              {!locked && <button type="button" disabled={!sponsorType.trim()} onClick={() => { onAssign(selected, sponsorType.trim()); setSelected(null); setQ(''); setSponsorType('') }} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="px-4 py-2 text-sm disabled:opacity-40">Add sponsor</button>}
            </div>
          </div>
        </div>
      )}
      {creating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCreating(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <OREV1116SponsorCreateForm theme={theme} onDone={() => setCreating(false)} />
          </div>
        </div>
      )}
      {zoomedUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setZoomedUrl(null)}>
          <img src={zoomedUrl} className="max-w-md max-h-[80vh] rounded-2xl object-contain bg-white" />
        </div>
      )}
    </div>
  )
}
