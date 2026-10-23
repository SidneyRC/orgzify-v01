// THIS FILE GOES IN: components/shared/OREV1-120-EventHeroBanner.tsx (REPLACES existing file)
// Event banner. Every YouTube link is its own video card, FIRST in the carousel, in the order added.
// Each video plays by itself (muted) to its end, then the next video starts.
// After the last video the pictures rotate every 5 seconds, looping among themselves (not back to the videos).
// A video can be replayed by going back to it with the arrow or dots.
// Dots are buttons (tap to jump) with a thin dark edge so they show on light pictures.
// With no video link it works exactly as before (manual arrows and dots).
'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import OREV1152EventHeroVideo, { youtubeId } from '@/components/shared/OREV1-152-EventHeroVideo'

type Banner = { id: string; file_url: string; media_type: string; is_default_banner: boolean }
type VideoCard = { video: string }
const isVideo = (c: any): c is VideoCard => !!c && typeof c.video === 'string'

export default function OREV1120EventHeroBanner({ banners, videoUrls }: { banners: Banner[]; videoUrls?: (string | null)[] }) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const sorted = [...banners].sort((a, b) => (b.is_default_banner ? 1 : 0) - (a.is_default_banner ? 1 : 0))
  const [skipped, setSkipped] = useState<string[]>([])
  const [auto, setAuto] = useState(false)
  const [index, setIndex] = useState(0)
  const found = (videoUrls || []).map(u => youtubeId(u)).filter((x): x is string => !!x)
  const ids = Array.from(new Set(found)).filter(id => !skipped.includes(id))
  const cards: (VideoCard | Banner)[] = [...ids.map(id => ({ video: id })), ...sorted]
  const firstPic = ids.length
  const current = cards[index]
  const next = () => setIndex(i => (i + 1) % cards.length)
  const prev = () => setIndex(i => (i - 1 + cards.length) % cards.length)
  const advance = () => {
    const n = index + 1
    if (n >= cards.length) return
    if (n >= firstPic) setAuto(true)
    setIndex(n)
  }
  const goTo = (i: number) => {
    if (ids.length > 0 && i >= firstPic) setAuto(true)
    setIndex(i)
  }

  useEffect(() => {
    if (!auto || isVideo(current) || cards.length - firstPic < 2) return
    const t = setTimeout(() => setIndex(i => (i + 1 >= cards.length ? firstPic : i + 1)), 5000)
    return () => clearTimeout(t)
  }, [auto, index, cards.length])

  return (
    <div className="relative w-full aspect-[21/9] overflow-hidden" style={{ borderRadius: radius, backgroundColor: theme?.color_surface || '#f3f4f6' }}>
      {isVideo(current) ? (
        <OREV1152EventHeroVideo key={current.video} videoId={current.video} onEnded={advance} onSkip={() => setSkipped(s => [...s, current.video])} />
      ) : current?.media_type === 'video' ? (
        <video src={current.file_url} controls className="w-full h-full object-cover" />
      ) : (
        <img src={current?.file_url} alt="Event banner" className="w-full h-full object-cover" />
      )}
      {cards.length > 1 && (
        <>
          <button onClick={prev} aria-label="Previous" className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff' }}>‹</button>
          <button onClick={next} aria-label="Next" className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: '#fff' }}>›</button>
          <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex">
            {cards.map((_, i) => (
              <button key={i} onClick={() => goTo(i)} aria-label={'Go to ' + (i + 1)} className="p-1 outline-none!">
                <span className="block w-2.5 h-2.5 rounded-full" style={{ backgroundColor: i === index ? '#fff' : 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.55)' }} />
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
