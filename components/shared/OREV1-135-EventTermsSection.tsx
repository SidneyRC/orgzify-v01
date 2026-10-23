// THIS FILE GOES IN: components/shared/OREV1-135-EventTermsSection.tsx (NEW FILE)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'

export default function OREV1135EventTermsSection({ terms }: { terms: string }) {
  const { theme } = useTheme()
  const [show, setShow] = useState(false)
  return (
    <div className="pt-6" style={{ borderTop: `1px solid ${theme?.divider_color || '#e5e7eb'}` }}>
      <button onClick={() => setShow(!show)} className="text-lg font-semibold flex items-center gap-1" style={{ color: theme?.color_text_primary || '#111827' }}>
        Terms & Conditions<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: show ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {show && <div className="text-base mt-2" style={{ color: theme?.color_text_muted || '#9ca3af' }} dangerouslySetInnerHTML={{ __html: terms }} />}
    </div>
  )
}