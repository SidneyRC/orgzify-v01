'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import AdminShell from '@/components/admin/OREV1-042-AdminShell'

type AccessInfo = {
  company_name: string
  role: string
  rights: string[]
}

export default function CompanyDashboardPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [state, setState] = useState<'loading' | 'ready'>('loading')
  const [info, setInfo] = useState<AccessInfo | null>(null)

  useEffect(() => {
    fetch(`/company/access`).then(r => r.json()).then(json => {
      const loginUrl = `/login?next=${encodeURIComponent(`/company/${slug}/dashboard`)}`
      if (json.allowed) { setInfo(json); setState('ready'); return }
      if (json.reason === 'wrong_user') { window.location.href = `/logout?next=${encodeURIComponent(loginUrl)}`; return }
      router.push(loginUrl)
    })
  }, [slug])

  if (state === 'loading') return <div className="flex items-center justify-center min-h-screen"><p className="text-sm text-gray-400">Loading…</p></div>

  const roleLabel = info?.role === 'super_admin' ? 'Super Admin' : 'Company Admin'

  return (
    <AdminShell
      initialName=""
      initialAvatar=""
      companyName={info?.company_name}
      roleLabel={roleLabel}
      rights={info?.rights ?? []}
      slug={slug}
    >
      <div className="text-sm text-gray-400">Dashboard widgets coming soon</div>
    </AdminShell>
  )
}
