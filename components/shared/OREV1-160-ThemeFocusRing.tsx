// THIS FILE GOES IN: components/shared/OREV1-160-ThemeFocusRing.tsx (NEW file)
// Sets the company theme's focus-ring colour as one site-wide CSS variable (--theme-focus-ring).
// app/globals.css uses it for the keyboard focus outline and falls back to blue when there is none.
// Draws nothing on the page. Mounted once inside ThemeProvider (lib/ThemeContext.tsx).
'use client'
import { useEffect } from 'react'

export default function OREV1160ThemeFocusRing({ color }: { color?: string | null }) {
  useEffect(() => {
    if (!color) return
    const root = document.documentElement
    root.style.setProperty('--theme-focus-ring', color)
    return () => root.style.removeProperty('--theme-focus-ring')
  }, [color])
  return null
}
