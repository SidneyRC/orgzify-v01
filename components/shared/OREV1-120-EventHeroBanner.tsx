// THIS FILE GOES IN: components/shared/OREV1-120-EventHeroBanner.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type Banner = { id: string; file_url: string; media_type: string; is_default_banner: boolean }

export default function OREV1120EventHeroBanner({ banners }: { banners: Banner[] }) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const sorted = [...banners].sort((a, b) => (b.is_default_banner ? 1 : 0) - (a.is_default_banner ? 1 : 0))
  const [index, setIndex] = useState(0)
  const current = sorted[index]
  const next = () => setIndex(i => (i + 1) % sorted.length)
  const prev = () => setIndex(i => (i - 1 + sorted.length) % sorted.length)

  return (
    <div className="relative w-full aspect-[21/9] overflow-hidden" style={{ borderRadius: radius, backgroundColor: theme?.color_surface || '#f3f4f6' }}>
      {current?.media_type === 'video' ? (
        <video src={current.file_url} controls className="w-full h-full object-cover" />
      ) : (
        <img src={current?.file_url} alt="Event banner" className="w-full h-full object-cover" />
      )}
      {sorted.length > 1 && (
        <>
          <button onClick={prev} aria-label="Previous" className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff' }}>‹</button>
          <button onClick={next} aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff' }}>›</button>
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5">
            {sorted.map((_, i) => <span key={i} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.5)' }} />)}
          </div>
        </>
      )}
    </div>
  )
}