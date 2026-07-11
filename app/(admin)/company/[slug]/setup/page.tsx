'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import AdminShell from '@/components/admin/OREV1-042-AdminShell'

type AccessInfo = { company_name: string; role: string; rights: string[] }
type CardsData = {
  companies?: { count: number }
  geofence?: { companies: number; countries: number; states: number }
  assign_roles?: { companies: number; assigned: number }
}

export default function CompanySetupPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const [state, setState] = useState<'loading' | 'ready'>('loading')
  const [info, setInfo] = useState<AccessInfo | null>(null)
  const [cards, setCards] = useState<CardsData>({})

  useEffect(() => {
    fetch(`/company/${slug}/access`).then(r => r.json()).then(json => {
      const loginUrl = `/login?next=${encodeURIComponent(`/company/${slug}/setup`)}`
      if (!json.allowed) {
        if (json.reason === 'wrong_user') { window.location.href = `/logout?next=${encodeURIComponent(loginUrl)}`; return }
        router.push(loginUrl); return
      }
      setInfo(json)
      fetch(`/company/${slug}/setup/api`).then(r => r.json()).then(data => {
        setCards(data.cards || {})
        setState('ready')
      })
    })
  }, [slug])

  if (state === 'loading') return <div className="flex items-center justify-center min-h-screen"><p className="text-sm text-gray-400">Loading…</p></div>

  const roleLabel = info?.role === 'super_admin' ? 'Super Admin' : 'Company Admin'

  // Note: the access check above already synced the active context cookie —
  // these links stay plain/clean, no ID of any kind needed in the address bar.
  const allCards = [
    { key: 'companies', title: 'Companies', description: 'Manage all registered companies', href: `/admin/setup/companies`, icon: '🏢', meta: cards.companies ? `${cards.companies.count} active` : '' },
    { key: 'geofence', title: 'Geofence', description: 'Assign territory coverage to branches', href: `/admin/setup/geofence`, icon: '🗺️', meta: cards.geofence ? `Companies: ${cards.geofence.companies} | Countries: ${cards.geofence.countries} | States: ${cards.geofence.states}` : '' },
    { key: 'assign_roles', title: 'Assign Roles', description: 'Assign roles to users across companies', href: `/admin/setup/assign-role`, icon: '🧑‍💼', meta: cards.assign_roles ? `Companies: ${cards.assign_roles.companies} | Assigned: ${cards.assign_roles.assigned}` : '' },
  ].filter(c => (cards as any)[c.key])

  return (
    <AdminShell initialName="" initialAvatar="" companyName={info?.company_name} roleLabel={roleLabel} rights={info?.rights ?? []} slug={slug}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Setup</h1>
        <p className="text-sm mt-1 text-gray-400">Company-level configuration</p>
      </div>
      {allCards.length === 0 ? (
        <p className="text-sm text-gray-400">You don't have access to any setup sections yet.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {allCards.map(card => (
            <Link key={card.key} href={card.href} className="bg-white border border-gray-100 rounded-2xl p-7 hover:shadow-lg transition-shadow flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <span className="text-4xl">{card.icon}</span>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">Active</span>
              </div>
              <div>
                <p className="text-base font-semibold text-gray-800">{card.title}</p>
                <p className="text-sm mt-0.5 text-gray-400">{card.description}</p>
              </div>
              <p className="text-xs border-t border-gray-50 pt-2 text-gray-400">{card.meta}</p>
            </Link>
          ))}
        </div>
      )}
    </AdminShell>
  )
}
