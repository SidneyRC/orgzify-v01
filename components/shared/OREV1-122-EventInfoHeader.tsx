// THIS FILE GOES IN: components/shared/OREV1-122-EventInfoHeader.tsx (REPLACES existing file)
'use client'
import { useTheme } from '@/lib/ThemeContext'
import OREV1132EventBreadcrumb from '@/components/shared/OREV1-132-EventBreadcrumb'

export default function OREV1122EventInfoHeader({ event }: { event: any }) {
  const { theme } = useTheme()
  const chipStyle = { backgroundColor: theme?.badge_success_bg || '#eff6ff', color: theme?.link_color || '#2563eb' }

  return (
    <div className="flex flex-col gap-3">
      <OREV1132EventBreadcrumb category={event.category_name} eventName={event.name} />
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={chipStyle}>{event.category_name}</span>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full" style={chipStyle}>{event.sub_category_name}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold" style={{ color: theme?.color_text_primary || '#111827' }}>{event.name}</h1>
        <button aria-label="Share event" className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: theme?.color_surface || '#f3f4f6' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: theme?.color_text_secondary || '#4b5563' }}>
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
          </svg>
        </button>
      </div>
    </div>
  )
}