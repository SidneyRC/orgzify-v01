// THIS FILE GOES IN: components/shared/OREV1-109C-SponsorsSocialLinks.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import OREV1109DSponsorSearchAdd from '@/components/shared/OREV1-109D-SponsorSearchAdd'
const SPONSORS_API = '/biz/events/sponsors/api'
const LINKS_API = '/biz/events/sociallinks/api'
const PLATFORMS = ['Facebook', 'Instagram', 'X', 'YouTube', 'Website', 'Other']
type EventSponsor = { id: string; sponsor_type: string; sponsors: { id: string; name: string; logo_url: string | null } }
type SocialLink = { id: string; platform: string; url: string }
type Props = { eventId: string; locked: boolean; theme: any }

function SponsorTile({ es, locked, onRemove, theme }: { es: EventSponsor; locked: boolean; onRemove: (id: string) => void; theme: any }) {
  return (
    <div className="relative rounded-xl border border-gray-100 p-3 flex flex-col items-center text-center bg-white">
      {!locked && <button onClick={() => onRemove(es.id)} className="absolute top-1.5 right-1.5 text-[10px] text-red-500">✕</button>}
      <span className="text-[10px] font-semibold uppercase tracking-wide mb-2" style={{ color: theme?.btn_bg || '#1e3a8a' }}>{es.sponsor_type}</span>
      {es.sponsors.logo_url ? <img src={es.sponsors.logo_url} className="w-14 h-14 rounded-full object-cover mb-2" /> : <span className="w-14 h-14 rounded-full bg-gray-100 mb-2 flex items-center justify-center text-sm text-gray-400">{es.sponsors.name[0]}</span>}
      <span className="text-xs font-medium text-gray-700">{es.sponsors.name}</span>
    </div>
  )
}

export default function OREV1109CSponsorsSocialLinks({ eventId, locked, theme }: Props) {
  const [sponsors, setSponsors] = useState<EventSponsor[]>([])
  const [links, setLinks] = useState<SocialLink[]>([])
  const [platform, setPlatform] = useState('Facebook')
  const [url, setUrl] = useState('')
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }

  const loadSponsors = () => fetch(`${SPONSORS_API}?event_id=${eventId}`).then(r => r.json()).then(j => setSponsors(j.data || []))
  const loadLinks = () => fetch(`${LINKS_API}?event_id=${eventId}`).then(r => r.json()).then(j => setLinks(j.data || []))
  useEffect(() => { if (eventId) { loadSponsors(); loadLinks() } }, [eventId])

  const handleAssign = async (sponsor: { id: string; name: string; logo_url: string | null }, sponsorType: string) => {
    const res = await fetch(SPONSORS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'assign', event_id: eventId, sponsor_id: sponsor.id, sponsor_type: sponsorType }) })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    toast.success('Sponsor added'); loadSponsors()
  }
  const handleRemoveSponsor = async (id: string) => { await fetch(`${SPONSORS_API}?id=${id}`, { method: 'DELETE' }); loadSponsors() }

  const handleAddLink = async () => {
    if (!url.trim()) return
    const res = await fetch(LINKS_API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_id: eventId, platform, url: url.trim() }) })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Failed'); return }
    setUrl(''); loadLinks()
  }
  const handleRemoveLink = async (id: string) => { await fetch(`${LINKS_API}?id=${id}`, { method: 'DELETE' }); loadLinks() }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: theme?.color_text_primary || '#111827' }}>Sponsors (optional)</h3>
        {sponsors.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {sponsors.map(es => <SponsorTile key={es.id} es={es} locked={locked} onRemove={handleRemoveSponsor} theme={theme} />)}
          </div>
        )}
        {!locked && <OREV1109DSponsorSearchAdd locked={locked} theme={theme} onAssign={handleAssign} />}
      </div>
      <div>
        <h3 className="text-sm font-semibold mb-3" style={{ color: theme?.color_text_primary || '#111827' }}>Social Media Links (optional)</h3>
        {links.length > 0 && (
          <div className="flex flex-col gap-2 mb-3">
            {links.map(l => (
              <div key={l.id} className="flex items-center gap-2 text-sm">
                <span className="w-20 text-xs" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{l.platform}</span>
                <span className="flex-1 truncate text-gray-700">{l.url}</span>
                {!locked && <button onClick={() => handleRemoveLink(l.id)} className="text-red-500 text-xs">✕</button>}
              </div>
            ))}
          </div>
        )}
        {!locked && (
          <div className="flex gap-2">
            <select value={platform} onChange={e => setPlatform(e.target.value)} className="h-9 px-2 text-sm" style={inputStyle}>
              {PLATFORMS.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
            <input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." className="h-9 px-3 text-sm flex-1 focus:outline-none" style={inputStyle} />
            <button onClick={handleAddLink} style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }} className="px-4 text-sm">+ Add</button>
          </div>
        )}
      </div>
    </div>
  )
}
