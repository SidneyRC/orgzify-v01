// THIS FILE GOES IN: components/shared/OREV1-117B-ArtistSearchAdd.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
import OREV1117ArtistCreateForm from '@/components/shared/OREV1-117-ArtistCreateForm'
const ARTISTS_API = '/biz/events/artists/api'
type Artist = { id: string; name: string; photo_url: string | null }
type Props = { locked: boolean; theme: any; onAssign: (artist: Artist) => void }

export default function OREV1117BArtistSearchAdd({ locked, theme, onAssign }: Props) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState<Artist[]>([])
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
    setQ(val)
    if (!val.trim()) { setResults([]); return }
    const res = await fetch(`${ARTISTS_API}?search=${encodeURIComponent(val)}`)
    const json = await res.json()
    setResults(json.data || [])
  }

  const handlePick = (a: Artist) => { onAssign(a); setQ(''); setResults([]) }

  return (
    <div className="border border-gray-100 rounded-xl p-4">
      <label className="text-xs font-medium block mb-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Search artist by name</label>
      <div className="flex gap-2">
        <input disabled={locked} value={q} onChange={e => runSearch(e.target.value)} placeholder="Type an artist name" className="h-9 px-3 text-sm flex-1 focus:outline-none" style={inputStyle} />
        {!locked && <button type="button" onClick={() => setCreating(true)} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="px-4 text-sm shrink-0">+ Add</button>}
      </div>
      {q.trim() && (
        <div className="mt-1 border border-gray-100 rounded-xl max-h-40 overflow-y-auto">
          {results.map(a => (
            <button key={a.id} type="button" onClick={() => handlePick(a)} className="w-full flex items-center gap-3 text-left text-sm px-3 py-2.5 hover:bg-gray-50 border-b border-gray-50 last:border-0">
              {a.photo_url ? (
                <div className="relative w-14 h-14 shrink-0" onClick={e => { e.stopPropagation(); setZoomedUrl(a.photo_url) }}>
                  <img src={a.photo_url} className="w-14 h-14 rounded-full object-cover cursor-zoom-in" />
                  <span className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-white border border-gray-200 flex items-center justify-center text-[9px]">🔍</span>
                </div>
              ) : <span className="w-14 h-14 rounded-full bg-gray-100 shrink-0" />}
              {a.name}
            </button>
          ))}
          {results.length === 0 && <p className="text-xs px-3 py-2" style={{ color: theme?.color_text_muted || '#9ca3af' }}>No match. You can create a new artist.</p>}
        </div>
      )}
      {creating && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCreating(false)}>
          <div className="bg-white rounded-2xl p-5 w-full max-w-sm max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <OREV1117ArtistCreateForm theme={theme} onDone={() => setCreating(false)} />
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
