// THIS FILE GOES IN: lib/eventAccess.ts (REPLACES the version saved earlier today)
// One shared answer to: "may this logged-in person open / change this event?"
// The login AND the business they are working as (cookie, via getActiveEntityContext) decide it:
// - Working as a business: ONLY that business's events. Allowed if the person owns it, or is Super Admin
//   (same rule as app/(admin)/entity/access). The same login owning another business changes nothing.
// - Admin Panel (no business): Super Admin = all events; Admin / staff = by their Events right (hasModuleRight).
// A refused person must be told the event "cannot be found", never "not allowed" (do not reveal it exists).
import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { hasModuleRight } from '@/lib/adminModuleRights'
import { getActiveEntityContext } from '@/lib/activeCompanyContext'

export type EventSource = { eventId?: string; eventVenueId?: string; dateId?: string; timeId?: string }

export async function resolveEventId(src: EventSource): Promise<string | null> {
  let venueId = src.eventVenueId || null
  let dateId = src.dateId || null
  if (src.timeId) {
    const { data } = await supabaseAdmin.from('event_venue_times').select('event_venue_date_id').eq('id', src.timeId).maybeSingle()
    dateId = data?.event_venue_date_id || null
    if (!dateId) return null
  }
  if (dateId) {
    const { data } = await supabaseAdmin.from('event_venue_dates').select('event_venue_id').eq('id', dateId).maybeSingle()
    venueId = data?.event_venue_id || null
    if (!venueId) return null
  }
  if (venueId) {
    const { data } = await supabaseAdmin.from('event_venues').select('event_id').eq('id', venueId).maybeSingle()
    return data?.event_id || null
  }
  return src.eventId || null
}

// May this person work as this business? Owner or Super Admin (same rule as /entity/access).
export async function mayWorkAsBusiness(session: any, entityId: string): Promise<boolean> {
  const { data: user } = await supabaseAdmin.from('users').select('is_super_admin').eq('id', session.user_id).maybeSingle()
  if (user?.is_super_admin === true) return true
  const { data: entity } = await supabaseAdmin.from('entities').select('user_id').eq('id', entityId).maybeSingle()
  if (entity?.user_id === session.user_id) return true
  // TEAM RIGHTS (organiser staff) will plug in HERE later, from the user and rights tables.
  return false
}

// May this person work on the records of this business (entityId)?
export async function checkEntityAccess(req: NextRequest, session: any, entityId: string | null, mode: 'view' | 'edit'): Promise<boolean> {
  const ctx = await getActiveEntityContext(req.cookies)
  if (ctx.entityId) return !!entityId && entityId === ctx.entityId && (await mayWorkAsBusiness(session, ctx.entityId))
  return hasModuleRight(req, session, 'events', mode === 'edit' ? 'can_edit' : 'can_view')
}

export async function checkEventAccess(req: NextRequest, session: any, src: EventSource, mode: 'view' | 'edit') {
  const eventId = await resolveEventId(src)
  if (!eventId) return { ok: false, eventId: null as string | null }
  const { data: event } = await supabaseAdmin.from('events').select('entity_id').eq('id', eventId).maybeSingle()
  const ok = await checkEntityAccess(req, session, event?.entity_id || null, mode)
  return { ok, eventId }
}
