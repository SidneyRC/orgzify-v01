// THIS FILE GOES IN: app/biz/[slug]/events/venue/new/page.tsx (NEW FILE)
'use client'
import { useEffect, useState } from 'react'
import { useParams, useSearchParams, useRouter } from 'next/navigation'
import OREV1092VenueForm from '@/components/admin/OREV1-092-VenueForm'

export default function EntityAddVenuePage() {
  const { slug } = useParams<{ slug: string }>()
  const searchParams = useSearchParams()
  const router = useRouter()
  const ref = searchParams.get('ref') || ''
  const [entityId, setEntityId] = useState<string | null>(null)
  const [state, setState] = useState<'loading' | 'ready'>('loading')

  useEffect(() => {
    fetch('/entity/access').then(r => r.json()).then(json => {
      if (!json.allowed || json.status !== 'active') { router.push(`/biz/${slug}/dashboard`); return }
      setEntityId(json.entity_id)
      setState('ready')
    })
  }, [slug])

  if (state === 'loading') return <div className="text-sm text-gray-400 p-6">Loading…</div>
  if (!entityId) return null

  return <OREV1092VenueForm mode="add" entityMode={{ entityId, entitySlug: slug, returnRef: ref }} />
}
