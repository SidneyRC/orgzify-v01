// THIS FILE GOES IN: components/shared/OREV1-123-EventAboutSection.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'

export default function OREV1123EventAboutSection({ description }: { description: string }) {
  const { theme } = useTheme()
  const [expanded, setExpanded] = useState(false)
  const clampStyle = expanded ? {} : { display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical' as const, overflow: 'hidden' }
  if (!description) return null

  return (
    <div className="pt-4" style={{ borderTop: '1px solid ' + (theme?.divider_color || '#e5e7eb') }}>
      <p className="text-base font-semibold mb-2" style={{ color: theme?.color_text_primary || '#111827' }}>About this event</p>
      <div className="text-base leading-relaxed" style={{ color: theme?.color_text_secondary || '#4b5563', ...clampStyle }} dangerouslySetInnerHTML={{ __html: description }} />
      <button onClick={() => setExpanded(!expanded)} className="text-sm font-semibold mt-2" style={{ color: theme?.link_color || '#2563eb' }}>
        {expanded ? 'Show less' : 'Read more'}
      </button>
    </div>
  )
}