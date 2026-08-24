// THIS FILE GOES IN: components/shared/OREV1-121-EventGallery.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'

type GalleryItem = { id: string; file_url: string; caption: string | null }

export default function OREV1121EventGallery({ gallery }: { gallery: GalleryItem[] }) {
  const { theme } = useTheme()
  const [open, setOpen] = useState<number | null>(null)
  if (!gallery || gallery.length === 0) return null
  const radius = theme?.global_border_radius || '12px'

  return (
    <div className="pt-4" style={{ borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb') }}>
      <p className="text-base font-semibold mb-3" style={{ color: theme?.color_text_primary || '#111827' }}>Gallery</p>
      <div className="flex gap-3 overflow-x-auto pb-1">
        {gallery.map((g, i) => (
          <button key={g.id} onClick={() => setOpen(i)} className="shrink-0 w-28 h-28 overflow-hidden" style={{ borderRadius: radius, backgroundColor: theme?.color_surface || '#f3f4f6' }}>
            <img src={g.file_url} alt={g.caption || ''} className="w-full h-full object-cover" />
          </button>
        ))}
      </div>
      {open !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.85)' }} onClick={() => setOpen(null)}>
          <img src={gallery[open].file_url} alt={gallery[open].caption || ''} className="max-w-full max-h-full object-contain" />
        </div>
      )}
    </div>
  )
}