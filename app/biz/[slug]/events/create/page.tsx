// THIS FILE GOES IN: app/biz/[slug]/events/create/page.tsx
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import OREV1100EventRegistration from '@/components/shared/OREV1-100-EventRegistration'

export default function CreateEventPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
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

  return <OREV1100EventRegistration entityId={entityId} entitySlug={slug} />
}