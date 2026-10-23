// THIS FILE GOES IN: components/shared/OREV1-115B-ReviewInfoSection.tsx (REPLACES existing file)
'use client'
import { useState, useEffect } from 'react'
import OREV1115AReviewSectionHeader from '@/components/shared/OREV1-115A-ReviewSectionHeader'
import type { EventDraft } from '@/components/shared/OREV1-100-EventRegistration'; import { cleanHtml } from '@/lib/cleanHtml'

type Props = { event: EventDraft; onEditInfo: () => void; onEditAdditional: () => void; theme: any }
type Cat = { id: string; name: string }

function Row({ label, value, theme }: { label: string; value: string; theme: any }) {
  return (
    <div className="grid grid-cols-[140px_1fr] gap-4 py-3 px-3 border-b border-gray-50 last:border-0 text-sm max-w-4xl">
      <span style={{ color: theme?.color_text_muted || '#9ca3af' }}>{label}</span>
      {label === 'Description' || label === 'Terms & Conditions' ? <div className="min-w-0 overflow-x-auto" style={{ color: theme?.color_text_primary || '#111827' }} dangerouslySetInnerHTML={{ __html: cleanHtml(value) }} /> : <span style={{ color: theme?.color_text_primary || '#111827' }}>{value}</span>}
    </div>
  )
}

export default function OREV1115BReviewInfoSection({ event, onEditInfo, onEditAdditional, theme }: Props) {
  const [cats, setCats] = useState<Cat[]>([])
  const [tags, setTags] = useState<{ id: string; name: string }[]>([])
  const [subIds, setSubIds] = useState<string[]>([]); const [seo, setSeo] = useState('')
  useEffect(() => { fetch('/biz/events/api?type=categories').then(r => r.json()).then(j => setCats(j.data || [])) }, [])
  useEffect(() => { if (event.id) fetch(`/biz/events/api?type=event_tags&event_id=${event.id}`).then(r => r.json()).then(j => setTags(j.data || [])) }, [event.id])
  useEffect(() => { if (event.id) fetch(`/biz/events/api?type=event_sub_categories&event_id=${event.id}`).then(r => r.json()).then(j => setSubIds(j.data || [])).catch(() => {}) }, [event.id])
  useEffect(() => { if (event.id) fetch('/biz/events/seotext/api?event_id=' + event.id).then(r => r.json()).then(j => setSeo(j.text || '')).catch(() => {}) }, [event.id]); const catName = (id: string | null) => cats.find(c => c.id === id)?.name || ''
  const allSubIds = subIds.length > 0 ? subIds : (event.sub_category_id ? [event.sub_category_id] : [])
  const subNames = allSubIds.map(id => catName(id)).filter(Boolean).join(', ')
  const category = event.category_id ? catName(event.category_id) : ''
  const social = [
    ['Facebook', event.social_facebook_url], ['Instagram', event.social_instagram_url], ['X', event.social_x_url],
    ['YouTube', event.social_youtube_url], ['Website', event.social_website_url]
  ].filter(([, v]) => v)

  const infoRows = [
    ['Name', event.name], ['Category', category], ['Sub-category', subNames], ['Format', event.event_format], ['Visibility', event.visibility],
    ['Languages', (event.languages || []).join(', ')]
  ].filter(([, v]) => v) as [string, string][]

  const additionalRows = [
    ['Min age', event.min_age ? `${event.min_age}+` : ''], ['Duration', event.event_duration_minutes ? `${event.event_duration_minutes} min` : ''],
    ['Refunds', event.refund_allowed ? 'Allowed' : 'Not allowed'], ['Tags', tags.map(t => t.name).join(', ')], ['Description', event.description || ''], ['Terms & Conditions', (event as any).terms_conditions || ''], ['Search preview', seo]
  ].filter(([, v]) => v) as [string, string][]

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <OREV1115AReviewSectionHeader title="Event Info" onEdit={onEditInfo} theme={theme} />
      {infoRows.map(([l, v]) => <Row key={l} label={l} value={v} theme={theme} />)}
      <OREV1115AReviewSectionHeader title="Additional Info" onEdit={onEditAdditional} theme={theme} />
      {additionalRows.map(([l, v]) => <Row key={l} label={l} value={v} theme={theme} />)}
    </div>
  )
}
