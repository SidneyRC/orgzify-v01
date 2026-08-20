// THIS FILE GOES IN: components/shared/OREV1-115G-ReviewSponsorsArtistsSocial.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
import OREV1115AReviewSectionHeader from '@/components/shared/OREV1-115A-ReviewSectionHeader'

type Props = { eventId: string; onEdit: () => void; theme: any }

export default function OREV1115GReviewSponsorsArtistsSocial({ eventId, onEdit, theme }: Props) {
  const [sponsors, setSponsors] = useState<any[]>([])
  const [artists, setArtists] = useState<any[]>([])
  const [links, setLinks] = useState<any[]>([])
  useEffect(() => {
    if (!eventId) return
    fetch(`/biz/events/sponsors/api?event_id=${eventId}`).then(r => r.json()).then(j => setSponsors(j.data || []))
    fetch(`/biz/events/artists/api?event_id=${eventId}`).then(r => r.json()).then(j => setArtists(j.data || []))
    fetch(`/biz/events/sociallinks/api?event_id=${eventId}`).then(r => r.json()).then(j => setLinks(j.data || []))
  }, [eventId])
  const mutedText = { color: theme?.color_text_muted || '#9ca3af' }
  const headText = { color: theme?.color_text_primary || '#111827' }

  if (sponsors.length === 0 && artists.length === 0 && links.length === 0) return null

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <OREV1115AReviewSectionHeader title="Sponsors, Artists & Social Links" onEdit={onEdit} theme={theme} />
      <div className="p-3 flex flex-col gap-3">
        {sponsors.length > 0 && (
          <div>
            <p className="text-xs mb-1.5" style={mutedText}>Sponsors</p>
            <div className="flex gap-3 flex-wrap">
              {sponsors.map((s: any) => (
                <div key={s.id} className="flex items-center gap-2">
                  {s.sponsors?.logo_url ? <img src={s.sponsors.logo_url} className="w-8 h-8 rounded-full object-cover" /> : <span className="w-8 h-8 rounded-full bg-gray-100" />}
                  <span className="text-xs" style={headText}>{s.sponsors?.name} <span style={mutedText}>({s.sponsor_type})</span></span>
                </div>
              ))}
            </div>
          </div>
        )}
        {artists.length > 0 && (
          <div>
            <p className="text-xs mb-1.5" style={mutedText}>Artists</p>
            <div className="flex gap-3 flex-wrap">
              {artists.map((a: any) => (
                <div key={a.id} className="flex items-center gap-2">
                  {a.artists?.photo_url ? <img src={a.artists.photo_url} className="w-8 h-8 rounded-full object-cover" /> : <span className="w-8 h-8 rounded-full bg-gray-100" />}
                  <span className="text-xs" style={headText}>{a.artists?.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {links.length > 0 && (
          <div>
            <p className="text-xs mb-1.5" style={mutedText}>Social Links</p>
            <div className="flex flex-col gap-1">
              {links.map((l: any) => <p key={l.id} className="text-xs" style={headText}>{l.platform}: {l.url}</p>)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
