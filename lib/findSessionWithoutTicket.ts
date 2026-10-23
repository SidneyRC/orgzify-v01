// THIS FILE GOES IN: lib/findSessionWithoutTicket.ts (NEW FILE)
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Returns a short message naming the first session with no ticket, or null if all are fine.
export async function findSessionWithoutTicket(eventId: string): Promise<string | null> {
  const { data: venues } = await supabaseAdmin.from('event_venues').select('venues(external_name), event_venue_dates(event_date, event_venue_times(id, start_time))').eq('event_id', eventId)
  const { data: tickets } = await supabaseAdmin.from('event_ticket_types').select('id').eq('event_id', eventId)
  const ids = (tickets || []).map((t: any) => t.id)
  const { data: rows } = ids.length > 0 ? await supabaseAdmin.from('event_ticket_assignments').select('event_venue_time_id').in('ticket_type_id', ids) : { data: [] as any[] }
  const assigned = new Set((rows || []).map((a: any) => a.event_venue_time_id))
  for (const v of (venues || []) as any[]) for (const d of v.event_venue_dates || []) for (const t of d.event_venue_times || []) {
    if (assigned.has(t.id)) continue
    const day = new Date(d.event_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })
    return `Add a ticket to the ${day}, ${String(t.start_time).slice(0, 5)} session (${v.venues?.external_name || 'Venue'})`
  }
  return null
}