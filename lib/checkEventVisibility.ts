// lib/checkEventVisibility.ts
// Decides whether the current viewer is allowed to see this event.
// Preview access (via process_id link) always passes.
// Admin, Orgzify staff, or the event's own owner can always see it (their
// own preview) even if Unlisted — this bypasses the checks below.
// Everyone else (public access via slug link) must meet all live-event conditions.

import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function checkEventVisibility(event: any, session: any): Promise<boolean> {
  if (event.accessType === 'preview') return true

  if (session) {
    if (session.is_super_admin) return true
    const { data: entity } = await supabaseAdmin
      .from('entities').select('id').eq('id', event.entity_id).eq('user_id', session.user_id).maybeSingle()
    if (entity) return true
  }

  return (
    event.status === 'active' &&
    event.published === true &&
    event.visibility === 'public' &&
    event.event_status !== 'cancelled'
  )
}