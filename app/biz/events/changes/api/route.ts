// THIS FILE GOES IN: app/biz/events/changes/api/route.ts (NEW file)
// Admin-only. Lists what changed between an event's approved copy and its current draft.
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import { buildEventBundle } from '@/lib/buildEventBundle'
import { diffEventBundle } from '@/lib/diffEventBundle'

async function canApprove(req: NextRequest, session: any) {
  if (session.is_super_admin) return true
  const companyId = await getActiveCompanyId(req.cookies)
  if (!companyId) return false
  const rights = await getFullCompanyRights(session.user_id, companyId)
  return !!rights['events']?.['can_approve' as keyof typeof rights['events']]
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await canApprove(req, session))) return NextResponse.json({ error: 'You do not have permission to see changes.' }, { status: 403 })

  const eventId = req.nextUrl.searchParams.get('event_id')
  const processId = req.nextUrl.searchParams.get('process_id')
  if (!eventId && !processId) return NextResponse.json({ error: 'Missing event_id' }, { status: 400 })
  const { data: event } = await supabaseAdmin.from('events').select('*').eq(processId ? 'process_id' : 'id', (processId || eventId) as string).maybeSingle()
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  const approved = event.last_approved_snapshot as any
  if (!approved) return NextResponse.json({ changes: [] })

  const slotIds = Object.keys(approved.ticketsBySlot || {})
  const { data: rows } = slotIds.length
    ? await supabaseAdmin.from('event_ticket_assignments').select('event_venue_time_id, ticket_type_id').in('event_venue_time_id', slotIds)
    : { data: [] as any[] }
  const stillAssigned = new Set((rows || []).map((r: any) => `${r.event_venue_time_id}_${r.ticket_type_id}`))

  const draft = await buildEventBundle(event)
  return NextResponse.json({ changes: diffEventBundle(approved, draft, stillAssigned) })
}
