// THIS FILE GOES IN: components/shared/OREV1-135-EventTermsSection.tsx (NEW FILE)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'

export default function OREV1135EventTermsSection({ terms }: { terms: string }) {
  const { theme } = useTheme()
  const [show, setShow] = useState(false)
  return (
    <div className="pt-4" style={{ borderTop: `1px solid ${theme?.divider_color || '#e5e7eb'}` }}>
      <button onClick={() => setShow(!show)} className="text-sm font-semibold flex items-center gap-1" style={{ color: theme?.color_text_primary || '#111827' }}>
        Terms & Conditions {show ? '▲' : '▼'}
      </button>
      {show && <div className="text-xs mt-2" style={{ color: theme?.color_text_muted || '#9ca3af' }} dangerouslySetInnerHTML={{ __html: terms }} />}
    </div>
  )
}