// THIS FILE GOES IN: components/shared/OREV1-129-Footer.tsx (NEW FILE — temporary placeholder)
'use client'
import { useTheme } from '@/lib/ThemeContext'

export default function OREV1129Footer() {
  const { theme } = useTheme()
  return (
    <footer className="py-8 px-4 text-center text-xs" style={{ backgroundColor: theme?.sidebar_bg || '#1e3a8a', color: theme?.sidebar_text || '#fff' }}>
      Footer — placeholder, SEO links coming next
    </footer>
  )
}