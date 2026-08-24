// THIS FILE GOES IN: components/shared/OREV1-134-EventArtistsCarousel.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'

export default function OREV1134EventArtistsCarousel({ artists }: { artists: any[] }) {
  const { theme } = useTheme()
  const [selected, setSelected] = useState<any>(null)
  if (!artists || artists.length === 0) return null
  const radius = theme?.global_border_radius || '12px'
  const animate = artists.length > 4
  const displayArtists = animate ? [...artists, ...artists] : artists

  const card = (a: any, key: string) => (
    <button key={key} onClick={() => setSelected(a)} className="shrink-0 w-40 overflow-hidden text-center" style={{ borderRadius: radius, backgroundColor: theme?.color_surface || '#f3f4f6' }}>
      <div className="w-40 h-44" style={{ backgroundColor: theme?.avatar_bg || '#e5e7eb' }}>
        {a.photo_url && <img src={a.photo_url} alt={a.name} className="w-full h-full object-cover" />}
      </div>
      <div className="px-2 py-2">
        <p className="text-xs font-bold overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: theme?.color_text_primary || '#111827' }}>{a.name}</p>
        {a.role && <p className="text-xs mt-0.5 overflow-hidden text-ellipsis whitespace-nowrap" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{a.role}</p>}
      </div>
    </button>
  )

  return (
    <div className="pt-4" style={{ borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb') }}>
      <p className="text-base font-semibold mb-3" style={{ color: theme?.color_text_primary || '#111827' }}>Artists</p>
      <div className={animate ? 'flex gap-3 overflow-hidden' : 'flex gap-3 flex-wrap'}>
        {animate ? (
          <div className="flex gap-3 animate-[scroll_20s_linear_infinite] hover:[animation-play-state:paused]">
            {displayArtists.map((a, idx) => card(a, a.id + '-' + idx))}
          </div>
        ) : artists.map(a => card(a, a.id))}
      </div>
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setSelected(null)}>
          <div className="max-w-sm text-center" onClick={e => e.stopPropagation()}>
            {selected.photo_url ? <img src={selected.photo_url} alt={selected.name} className="max-h-[70vh] mx-auto" style={{ borderRadius: radius }} /> : <div className="w-64 h-80" style={{ backgroundColor: theme?.avatar_bg || '#e5e7eb', borderRadius: radius }} />}
            <p className="text-white text-lg font-semibold mt-3">{selected.name}</p>
            {selected.role && <p className="text-gray-300 text-sm">{selected.role}</p>}
          </div>
        </div>
      )}
      <style>{'@keyframes scroll { from { transform: translateX(0); } to { transform: translateX(-50%); } }'}</style>
    </div>
  )
}