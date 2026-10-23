// THIS FILE GOES IN: components/shared/OREV1-134-EventArtistsCarousel.tsx (REPLACES existing file)
'use client'
import { useTheme } from '@/lib/ThemeContext'

export default function OREV1134EventArtistsCarousel({ artist, onClose }: { artist: any; onClose: () => void }) {
  const { theme } = useTheme()
  if (!artist) return null
  const radius = theme?.global_border_radius || '12px'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={onClose}>
      <div className="max-w-sm text-center" onClick={e => e.stopPropagation()}>
        {artist.photo_url
          ? <img src={artist.photo_url} alt={artist.name} className="max-h-[70vh] mx-auto" style={{ borderRadius: radius }} />
          : <div className="w-64 h-80" style={{ backgroundColor: theme?.avatar_bg || '#e5e7eb', borderRadius: radius }} />}
        <p className="text-white text-lg font-semibold mt-3">{artist.name}</p>
        {artist.role && <p className="text-gray-300 text-sm">{artist.role}</p>}
      </div>
    </div>
  )
}
