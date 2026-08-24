// THIS FILE GOES IN: components/shared/OREV1-128-EventRecommendations.tsx (NEW FILE)
'use client'
import { useTheme } from '@/lib/ThemeContext'

export default function OREV1128EventRecommendations({ items }: { items: any[] }) {
  const { theme } = useTheme()
  if (!items || items.length === 0) return null
  return (
    <div className="py-8" style={{ borderTop: `1px solid ${theme?.divider_color || '#e5e7eb'}` }}>
      <p className="text-lg font-semibold mb-4" style={{ color: theme?.color_text_primary || '#111827' }}>Events you may like</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map(i => (
          <a key={i.id} href={`/event/${i.slug}`} className="flex flex-col gap-2">
            <div className="w-full aspect-video" style={{ backgroundColor: theme?.color_surface || '#f3f4f6', borderRadius: theme?.global_border_radius || '12px' }} />
            <p className="text-xs font-medium" style={{ color: theme?.color_text_primary || '#111827' }}>{i.name}</p>
            <p className="text-xs" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{i.city}</p>
          </a>
        ))}
      </div>
    </div>
  )
}