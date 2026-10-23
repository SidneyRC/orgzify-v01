// THIS FILE GOES IN: lib/buildEventMetadata.ts (REPLACES existing file)
// Page preview tags for the public event page (Google + WhatsApp/Facebook cards).
// Kept here so app/event/[slug]/page.tsx stays short.
// "canonical" tells Google the ONE real address of the page, so the code link
// (/event/EVID0018) is never counted as a duplicate of the named address.
// Google's description now comes from buildEventSeoText (name, date, place, type,
// organiser, age, price). The WhatsApp/Facebook card line is unchanged.
import type { Metadata } from 'next'
import { buildEventShareMeta } from '@/lib/buildEventShareMeta'
import { buildEventSeoText } from '@/lib/buildEventSeoText'

const BASE_URL = 'https://www.orgzify.com'

export function buildEventMetadata(event: any, slug: string): Metadata {
  const share = buildEventShareMeta(event)
  const plain = (event.description || '').replace(/<[^>]*>/g, '').slice(0, 150)
  const description = buildEventSeoText(event) || plain
  return {
    title: event.name + ' — Orgzify',
    description,
    alternates: { canonical: BASE_URL + '/event/' + (event.slug || slug) },
    openGraph: {
      title: event.name,
      description: share.description || description,
      images: share.image ? [{ url: share.image }] : [],
    },
  }
}
