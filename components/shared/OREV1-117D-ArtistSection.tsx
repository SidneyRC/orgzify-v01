// THIS FILE GOES IN: components/shared/OREV1-117D-ArtistSection.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import OREV1117BArtistSearchAdd from '@/components/shared/OREV1-117B-ArtistSearchAdd'
const ARTISTS_API = '/biz/events/artists/api'
type EventArtist = { id: string; artists: { id: string; name: string; photo_url: string | null } }
type Props = { eventId: string; locked: boolean; theme: any }

function ArtistTile({ ea, locked, onRemove }: { ea: EventArtist; locked: boolean; onRemove: (id: string) => void }) {
  return (
    <div className="relative rounded-xl border border-gray-100 p-3 flex flex-col items-center text-center bg-white">
      {!locked && <button onClick={() => onRemove(ea.id)} className="absolute top-1.5 right-1.5 text-[10px] text-red-500">✕</button>}
      {ea.artists.photo_url ? <img src={ea.artists.photo_url} className="w-14 h-14 rounded-full object-cover mb-2" /> : <span className="w-14 h-14 rounded-full bg-gray-100 mb-2 flex items-center justify-center text-sm text-gray-400">{ea.artists.name[0]}</span>}
      <span className="text-xs font-medium text-gray-700">{ea.artists.name}</span>
    </div>
  )
}

export default function OREV1117DArtistSection({ eventId, locked, theme }: Props) {
  const [artists, setArtists] = useState<EventArtist[]>([])
  const loadArtists = () => fetch(`${ARTISTS_API}?event_id=${eventId}`).then(r => r.json()).then(j => setArtists(j.data || []))
  useEffect(() => { if (eventId) loadArtists() }, [eventId])

  const handleAssign = async (artist: { id: string; name: string; photo_url: string | null }) => {
    const res = await fetch(ARTISTS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assign', event_id: eventId, artist_id: artist.id }) })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    toast.success('Artist added'); loadArtists()
  }
  const handleRemove = async (id: string) => { await fetch(`${ARTISTS_API}?id=${id}`, { method: 'DELETE' }); loadArtists() }

  return (
    <div>
      <h3 className="text-sm font-semibold mb-3" style={{ color: theme?.color_text_primary || '#111827' }}>Artists (optional)</h3>
      {artists.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
          {artists.map(ea => <ArtistTile key={ea.id} ea={ea} locked={locked} onRemove={handleRemove} />)}
        </div>
      )}
      {!locked && <OREV1117BArtistSearchAdd locked={locked} theme={theme} onAssign={handleAssign} />}
    </div>
  )
}
