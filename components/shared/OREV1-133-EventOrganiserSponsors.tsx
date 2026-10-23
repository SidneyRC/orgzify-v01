// THIS FILE GOES IN: components/shared/OREV1-133-EventOrganiserSponsors.tsx (REPLACES existing file)
'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import { useAutoScroll } from '@/lib/useAutoScroll'
import OREV1134EventArtistsCarousel from '@/components/shared/OREV1-134-EventArtistsCarousel'

type Item = { key: string; name: string; image?: string; label: string; artist?: any }

export default function OREV1133EventOrganiserSponsors({ organiser, sponsors, artists }: { organiser: { name: string; logo_url?: string }; sponsors: any[]; artists: any[] }) {
  const { theme } = useTheme()
  const [selected, setSelected] = useState<any>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)
  const radius = theme?.global_border_radius || '12px'
  const items: Item[] = [
    { key: 'host', name: organiser.name, image: organiser.logo_url, label: 'Host' },
    ...(sponsors || []).map((s: any, n: number) => ({ key: 'sponsor-' + s.id + '-' + n, name: s.name, image: s.logo_url, label: s.sponsor_type || 'Sponsor' })),
    ...(artists || []).map((a: any, n: number) => ({ key: 'artist-' + a.id + '-' + n, name: a.name, image: a.photo_url, label: a.speciality_name || 'Artist', artist: a })),
  ]

  const auto = useAutoScroll(rowRef, items.length, 5, !!selected)
  const update = () => {
    const el = rowRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 4)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }
  useEffect(() => {
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [items.length])
  const move = (dir: number) => rowRef.current?.scrollBy({ left: dir * rowRef.current.clientWidth * 0.8, behavior: 'smooth' })

  const arrow = (dir: number) => (
    <button type="button" aria-label={dir < 0 ? 'Scroll left' : 'Scroll right'} onClick={() => move(dir)}
      className={'absolute top-[55px] lg:top-20 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow ' + (dir < 0 ? 'left-1' : 'right-1')}
      style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: '1px solid ' + (theme?.btn_outline_border || '#e5e7eb') }}>
      {dir < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  )

  const tile = (i: Item) => {
    const inner = (
      <>
        <div className="w-[110px] h-[110px] lg:w-40 lg:h-40 overflow-hidden flex items-center justify-center" style={{ borderRadius: radius, backgroundColor: theme?.avatar_bg || '#e5e7eb' }}>
          {i.image
            ? <img src={i.image} alt={i.name} className="w-full h-full object-cover" />
            : <span className="text-2xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>{(i.name || '?').charAt(0).toUpperCase()}</span>}
        </div>
        <p className="text-sm font-semibold mt-2 truncate" style={{ color: theme?.color_text_primary || '#111827' }}>{i.name}</p>
        <p className="text-xs" style={{ color: theme?.link_color || '#2563eb' }}>{i.label}</p>
      </>
    )
    const cls = 'shrink-0 w-[110px] lg:w-40 text-center'
    return i.artist
      ? <button key={i.key} onClick={() => setSelected({ name: i.name, photo_url: i.image, role: i.artist.role || i.label })} className={cls}>{inner}</button>
      : <button key={i.key} onClick={() => setSelected({ name: i.name, photo_url: i.image, role: i.label })} className={cls}>{inner}</button>
  }

  return (
    <div className="pt-4" style={{ borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb') }}>
      <p className="text-lg font-semibold mb-3" style={{ color: theme?.color_text_primary || '#111827' }}>Host, Sponsors &amp; Artists</p>
      <div className="relative" {...auto}>
        <div ref={rowRef} onScroll={update} className="flex gap-3 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">{items.map(tile)}</div>
        {canLeft && arrow(-1)}
        {canRight && arrow(1)}
      </div>
      <OREV1134EventArtistsCarousel artist={selected} onClose={() => setSelected(null)} />
    </div>
  )
}