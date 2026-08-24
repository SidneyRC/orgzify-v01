// components/shared/OREV1-132-EventBreadcrumb.tsx
'use client'
import Link from 'next/link'
import { useTheme } from '@/lib/ThemeContext'

export default function OREV1132EventBreadcrumb({ category, eventName }: { category?: string; eventName: string }) {
  const { theme } = useTheme()
  const linkColor = theme?.link_color || '#2563eb'
  const mutedText = theme?.color_text_muted || '#9ca3af'

  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs flex-wrap">
      <Link href="/" style={{ color: linkColor }} className="font-medium hover:opacity-80 transition">Home</Link>
      <span style={{ color: mutedText }}>/</span>
      <Link href="/events" style={{ color: linkColor }} className="font-medium hover:opacity-80 transition">Events</Link>
      {category && (
        <>
          <span style={{ color: mutedText }}>/</span>
          <Link
            href={`/events?category=${encodeURIComponent(category)}`}
            style={{ color: linkColor }}
            className="font-medium hover:opacity-80 transition"
          >
            {category}
          </Link>
        </>
      )}
      <span style={{ color: mutedText }}>/</span>
      <span style={{ color: mutedText }} className="truncate max-w-[200px]">{eventName}</span>
    </nav>
  )
}
