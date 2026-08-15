// GOES IN: components/admin/OREV1-095-MapPreview.tsx
'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type Props = { mapLink: string }

export default function OREV1095MapPreview({ mapLink }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const [failed, setFailed] = useState(false)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => { setFailed(false); setLoaded(false) }, [mapLink])

  if (!mapLink.trim()) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-gray-400 border border-gray-100" style={{ borderRadius: radius }}>
        Paste a map link to preview the location
      </div>
    )
  }

  if (failed) {
    return (
      <div className="flex items-center justify-center h-48 text-xs text-gray-400 border border-gray-100" style={{ borderRadius: radius }}>
        Map failed to load
      </div>
    )
  }

  return (
    <div className="relative h-48 overflow-hidden border border-gray-100" style={{ borderRadius: radius }}>
      {!loaded && <div className="absolute inset-0 flex items-center justify-center text-xs text-gray-400">Loading map…</div>}
      <iframe
        src={mapLink}
        className="w-full h-full"
        style={{ border: 0 }}
        loading="lazy"
        onLoad={() => setLoaded(true)}
        onError={() => setFailed(true)}
      />
    </div>
  )
}
