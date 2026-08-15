// THIS FILE GOES IN: app/biz/[slug]/dashboard/page.tsx (REPLACES existing file)
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import EntityDashboardHero from '@/components/shared/OREV1-074-EntityDashboardHero'
import EntityDashboardCards from '@/components/shared/OREV1-075-EntityDashboardCards'
import EntityDashboardOfficePanel from '@/components/shared/OREV1-076-EntityDashboardOfficePanel'

type Access = {
  entity_name: string; entity_id: string; process_id: string; status: string
  module_access: { pages: boolean; academy: boolean; events: boolean }
  reason: string | null
}
type Office = { company_name: string; address: any; contacts: any } | null

export default function EntityDashboardPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { theme } = useTheme()
  const [access, setAccess] = useState<Access | null>(null)
  const [office, setOffice] = useState<Office>(null)
  const [state, setState] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    fetch('/entity/access').then(r => r.json()).then(json => {
      const loginUrl = `/login?next=${encodeURIComponent(`/biz/${slug}/dashboard`)}`
      if (!json.allowed) {
        if (json.reason === 'wrong_user') window.location.href = `/logout?next=${encodeURIComponent(loginUrl)}`
        else router.push(loginUrl)
        return
      }
      if (json.status === 'draft') { router.push(`/biz/register?ref=${json.process_id}`); return }
      setAccess(json)
      if (json.status === 'active') {
        fetch(`/biz/register/api?type=reporting_office&entity_id=${json.entity_id}`)
          .then(r => r.json()).then(o => setOffice(o.data || null))
      }
      setState('ready')
    })
  }, [slug])

  if (state === 'loading') return <div className="text-sm text-gray-400 p-6">Loading…</div>
  if (access?.status === 'pending') return <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-gray-600">Your account is submitted and pending approval.</div>
  if (access?.status === 'rejected') return (
    <div className="bg-white rounded-2xl border border-red-100 p-8 text-center text-red-600">
      <p className="font-semibold mb-1">Your registration was not approved.</p>
      {access.reason && <p className="text-sm text-red-500">{access.reason}</p>}
    </div>
  )
  if (access?.status === 'suspended' || access?.status === 'blocked') return (
    <div className="bg-white rounded-2xl border border-red-100 p-8 text-center text-red-600">
      <p className="font-semibold mb-1">Your account has been {access.status}.</p>
      {access.reason ? <p className="text-sm text-red-500">{access.reason}</p> : <p className="text-sm text-red-500">Please contact support.</p>}
    </div>
  )
  if (!access) return null

  const radius = theme?.global_border_radius || '16px'

  return (
    <div className="w-full">
      <EntityDashboardHero entityName={access.entity_name} status={access.status} theme={theme} radius={radius} />
      <div className="flex flex-col lg:flex-row gap-4 mt-4">
        <div className="flex-1 min-w-0">
          <EntityDashboardCards processId={access.process_id} entitySlug={slug} moduleAccess={access.module_access} theme={theme} radius={radius} />
        </div>
        <div className="w-full lg:w-[300px] shrink-0">
          <EntityDashboardOfficePanel office={office} theme={theme} radius={radius} />
        </div>
      </div>
    </div>
  )
}
