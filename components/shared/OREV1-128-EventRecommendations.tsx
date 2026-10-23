// THIS FILE GOES IN: components/shared/OREV1-128-EventRecommendations.tsx (REPLACES existing file)
// "You May Also Like" row. Hand-scroll only, scrollbar hidden, round arrows appear only when cards overflow
// (same pattern as the Host, Sponsors & Artists row, OREV1-133). Cards come from lib/getRelatedEvents.ts.
'use client'
import { useState, useRef, useEffect } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useTheme } from '@/lib/ThemeContext'
import OREV1153RelatedEventCard from '@/components/shared/OREV1-153-RelatedEventCard'

export default function OREV1128EventRecommendations({ items, isLoggedIn }: { items: any[]; isLoggedIn: boolean }) {
  const { theme } = useTheme()
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

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
  }, [items?.length])

  if (!items || items.length === 0) return null
  const move = (dir: number) => rowRef.current?.scrollBy({ left: dir * rowRef.current.clientWidth * 0.8, behavior: 'smooth' })

  const arrow = (dir: number) => (
    <button type="button" aria-label={dir < 0 ? 'Scroll left' : 'Scroll right'} onClick={() => move(dir)}
      className={'absolute top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center shadow ' + (dir < 0 ? 'left-1' : 'right-1')}
      style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: '1px solid ' + (theme?.btn_outline_border || '#e5e7eb') }}>
      {dir < 0 ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
    </button>
  )

  return (
    <div className="py-8" style={{ borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb') }}>
      <p className="text-lg font-semibold mb-4" style={{ color: theme?.color_text_primary || '#111827' }}>You May Also Like</p>
      <div className="relative">
        <div ref={rowRef} onScroll={update} className="flex gap-4 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {items.map(i => <OREV1153RelatedEventCard key={i.id} item={i} isLoggedIn={isLoggedIn} />)}
        </div>
        {canLeft && arrow(-1)}
        {canRight && arrow(1)}
      </div>
    </div>
  )
}
