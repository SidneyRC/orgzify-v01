// THIS FILE GOES IN: components/shared/OREV1-136-EventTitleShare.tsx (REPLACES existing file)
'use client'
import { useTheme } from '@/lib/ThemeContext'

export default function OREV1136EventTitleShare({ event }: { event: any }) {
  const { theme } = useTheme()
  return (
    <div className="flex items-center justify-between gap-3 -mt-2 -mb-2">
      <h1 className="text-3xl font-extrabold leading-tight" style={{ color: theme?.color_text_primary || '#111827' }}>{event.name}</h1>
      <button aria-label="Share event" className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: theme?.color_surface || '#f3f4f6' }}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: theme?.color_text_secondary || '#4b5563' }}>
          <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
          <path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4" />
        </svg>
      </button>
    </div>
  )
}