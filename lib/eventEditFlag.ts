// THIS FILE GOES IN: lib/eventEditFlag.ts (NEW file)
// Shared by event edit routes: refuse edits while Admin is reviewing; mark a live event as having pending edits.
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function checkEventEditable(eventId: string) {
  const { data: event } = await supabaseAdmin.from('events').select('status').eq('id', eventId).maybeSingle()
  if (!event) return { error: 'Event not found' }
  if (event.status === 'pending') return { error: "This event is awaiting Admin review and can't be edited right now." }
  return { status: event.status }
}

export async function flagPendingEditsIfActive(eventId: string, status: string) {
  if (status === 'active') await supabaseAdmin.from('events').update({ has_pending_edits: true }).eq('id', eventId)
}
