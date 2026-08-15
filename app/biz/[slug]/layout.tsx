// THIS FILE GOES IN: app/biz/[slug]/layout.tsx (REPLACES the version built earlier this session)
'use client'
import { useEffect, useState } from 'react'
import { useParams, usePathname } from 'next/navigation'
import AdminShell from '@/components/admin/OREV1-042-AdminShell'

type ModuleAccess = { pages: boolean; academy: boolean; events: boolean }

export default function EntityShellLayout({ children }: { children: React.ReactNode }) {
  const { slug } = useParams<{ slug: string }>()
  const pathname = usePathname()
  const [ready, setReady] = useState(false)
  const [entityName, setEntityName] = useState('')
  const [entityId, setEntityId] = useState('')
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess>({ pages: false, academy: false, events: false })

  useEffect(() => {
    fetch('/entity/access').then(r => r.json()).then(json => {
      if (json.allowed && json.status === 'active') {
        setEntityName(json.entity_name)
        setEntityId(json.entity_id)
        setModuleAccess(json.module_access)
        setReady(true)
      }
    })
  }, [slug])

  if (!ready) return (
    <div className="flex items-center justify-center min-h-screen bg-[#f9fafb]">
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  )

  const isBareDashboard = pathname === `/biz/${slug}/dashboard`

  return (
    <AdminShell initialName="" initialAvatar="" entityName={entityName} entityId={entityId} entitySlug={slug} entityModuleAccess={moduleAccess} hideSidebar={isBareDashboard}>
      {children}
    </AdminShell>
  )
}
