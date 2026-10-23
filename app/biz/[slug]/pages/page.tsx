// THIS FILE GOES IN: app/biz/[slug]/pages/page.tsx (NEW FILE)
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import OREV1145PagesLogoBox from '@/components/shared/OREV1-145-PagesLogoBox'

export default function EntityPagesScreen() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { theme } = useTheme()
  const [entityId, setEntityId] = useState<string | null>(null)

  const radius = theme?.global_border_radius || '12px'
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  useEffect(() => {
    fetch('/entity/access').then(r => r.json()).then(json => {
      if (!json.allowed || json.status !== 'active' || !json.module_access?.pages) { router.push(`/biz/${slug}/dashboard`); return }
      setEntityId(json.entity_id)
    })
  }, [slug])

  return (
    <div className="w-full" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <h1 className="text-xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Pages</h1>
        <button onClick={() => router.push(`/biz/${slug}/dashboard`)} style={outlineBtn} className="sm:flex-none text-sm font-medium px-4 py-2 hover:opacity-90 transition">← Back</button>
      </div>
      {entityId
        ? <OREV1145PagesLogoBox entityId={entityId} theme={theme} />
        : <p className="text-sm" style={{ color: theme?.color_text_muted || '#9ca3af' }}>Loading…</p>}
    </div>
  )
}