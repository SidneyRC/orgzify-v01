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
  const [creating, setCreating] = useState(false)
  const [zoomedUrl, setZoomedUrl] = useState<string | null>(null)
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }

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
      {!creating ? (
        <>
          <Field label="Search sponsor by name" theme={theme}>
            <input disabled={locked} value={q} onChange={e => runSearch(e.target.value)} placeholder="Type a sponsor name" className="h-9 px-3 text-sm w-full focus:outline-none" style={inputStyle} />
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
              {results.length === 0 && <p className="text-xs px-3 py-2" style={{ color: theme?.color_text_muted || '#9ca3af' }}>No match. You can create a new sponsor below.</p>}
            </div>
          )}
          {selected && (
            <div className="mt-3">
              <Field label="Sponsor type" theme={theme}>
                <input disabled={locked} list="sponsor-types" value={sponsorType} onChange={e => setSponsorType(e.target.value)} placeholder="e.g. Title Sponsor" className="h-9 px-3 text-sm w-full focus:outline-none" style={inputStyle} />
                <datalist id="sponsor-types">{TYPE_SUGGESTIONS.map(t => <option key={t} value={t} />)}</datalist>
              </Field>
              {!locked && <button type="button" disabled={!sponsorType.trim()} onClick={() => { onAssign(selected, sponsorType.trim()); setSelected(null); setQ(''); setSponsorType('') }} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="mt-2 px-4 py-1.5 text-sm disabled:opacity-40">Add sponsor</button>}
            </div>
          )}
          {!locked && (
            <button type="button" onClick={() => setCreating(true)} className="w-full mt-3 rounded-xl border-2 border-dashed flex items-center justify-center gap-2 py-3 hover:opacity-80 transition" style={{ borderColor: theme?.input_border || '#e5e7eb' }}>
              <span className="text-lg leading-none" style={{ color: theme?.btn_bg || '#1e3a8a' }}>+</span>
              <span className="text-xs font-medium" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Create new sponsor</span>
            </button>
          )}
        </>
      ) : (
        <OREV1116SponsorCreateForm theme={theme} onDone={() => setCreating(false)} />
      )}
      {zoomedUrl && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={() => setZoomedUrl(null)}>
          <img src={zoomedUrl} className="max-w-md max-h-[80vh] rounded-2xl object-contain bg-white" />
        </div>
      )}
    </div>
  )
}
