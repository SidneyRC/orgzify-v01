// THIS FILE GOES IN: lib/getEventBySlugOrCode.ts (REPLACES existing file)
// Looks up an event by process_id or slug (single combined query — either
// link format works identically for the public).
//
// accessType is 'preview' ONLY before an event's first approval — Super Admin
// or the event's own owner can preview live/draft data pre-approval.
// Once an event has been approved even once, accessType is ALWAYS 'public'
// for everyone (owner and admin included) — no live preview after that,
// per Sidney's confirmed rule (Aug 31 2026).
//
// On the public/approved path, Quantity, sold count, Fast selling and
// Status are patched in live from event_ticket_assignments (see
// eventBundleLiveOverrides.ts) — those four don't wait for approval.
// Price and ticket identity stay frozen from the snapshot.
// Session rules (hide sessions with no open tickets, sold-out flag, onwards
// price, "no sessions left") are applied live too, by applyLiveSessionRules.
//
// The Host logo is also read live (entity_pages -> sponsors) and shown only
// when that sponsor row is 'approved', so no event re-approval is needed.
// The DEFAULT banner is read live too (liveDefaultBanner) — only among pictures
// already in the approved copy, so changing the default needs no approval.

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { buildEventBundle } from '@/lib/buildEventBundle'
import { buildLiveTicketOverrides, applyLiveSessionRules } from '@/lib/eventBundleLiveOverrides'; 
import { withLiveTileLabels } from '@/lib/liveTileLabels'; 
import { stripPrivateEventData } from '@/lib/stripPrivateEventData'

async function getHostLogo(entityId: string): Promise<string> {
  if (!entityId) return ''
  const { data: page } = await supabaseAdmin.from('entity_pages').select('sponsor_id').eq('entity_id', entityId).maybeSingle()
  if (!page?.sponsor_id) return ''
  const { data: sponsor } = await supabaseAdmin.from('sponsors').select('logo_url, status').eq('id', page.sponsor_id).maybeSingle()
  return sponsor?.status === 'approved' ? sponsor.logo_url || '' : ''
}

async function liveDefaultBanner(eventId: string, banners: any[]) {
  const { data } = await supabaseAdmin.from('event_media').select('id').eq('event_id', eventId).eq('section', 'banner').eq('is_default_banner', true).maybeSingle()
  if (!data?.id || !(banners || []).some((b: any) => b.id === data.id)) return banners
  return banners.map((b: any) => ({ ...b, is_default_banner: b.id === data.id }))
}

export async function getEventBySlugOrCode(value: string, session: any = null) {
  const { data: event, error } = await supabaseAdmin
    .from('events').select('*').or(`process_id.eq.${value},slug.eq.${value}`).maybeSingle()
  if (error) console.error('getEventBySlugOrCode:', error.message)
  if (!event) return null

  let accessType: 'preview' | 'public' = 'public'
  if (session && !event.approved_at) {
    if (session.is_super_admin) accessType = 'preview'
    else {
      const { data: entity } = await supabaseAdmin.from('entities').select('id').eq('id', event.entity_id).eq('user_id', session.user_id).maybeSingle()
      if (entity) accessType = 'preview'
    }
  }

  if (accessType === 'public' && event.approved_at && event.last_approved_snapshot) {
    const snapshot = stripPrivateEventData(event.last_approved_snapshot)
    const slotIds = Object.keys(snapshot.ticketsBySlot || {})
    const [overrides, hostLogo] = await Promise.all([buildLiveTicketOverrides(slotIds), getHostLogo(event.entity_id)])

    const liveTickets: Record<string, any[]> = {}
    for (const slotId of slotIds) {
      liveTickets[slotId] = (snapshot.ticketsBySlot[slotId] || [])
        .map((t: any) => {
          const live = overrides[`${slotId}_${t.id}`]
          if (!live) return t
          return { ...t, quantity: live.quantity, soldCount: live.soldCount, fastFilling: live.fastFilling, isEnabled: live.isEnabled }
        })
        .filter((t: any) => t.isEnabled !== false)
    }
    const rules = applyLiveSessionRules(snapshot, liveTickets)

    return {
      ...snapshot, ...rules, ...(await withLiveTileLabels(event.id, snapshot)), banners: await liveDefaultBanner(event.id, snapshot.banners), organiser_logo_url: hostLogo, published: event.published, booking_open: event.booking_open,
      languages: event.languages, visibility: event.visibility, accessType,
    }
  }

  const bundle = await buildEventBundle(event)
  return { ...bundle, organiser_logo_url: await getHostLogo(event.entity_id), accessType }
}
