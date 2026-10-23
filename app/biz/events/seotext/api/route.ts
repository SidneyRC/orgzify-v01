// THIS FILE GOES IN: app/biz/events/seotext/api/route.ts (NEW FILE)
// Admin-only. Gives the search description an event WILL have after approval,
// built from its current draft with the same shared rule Google uses.
// People without the Approve right get an empty answer, so the Review screen
// simply hides the row (no error shown to organisers).
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { hasModuleRight } from '@/lib/adminModuleRights'
import { buildEventBundle } from '@/lib/buildEventBundle'
import { buildEventSeoText } from '@/lib/buildEventSeoText'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session || !(await hasModuleRight(req, session, 'events', 'can_approve'))) return NextResponse.json({ text: '' })

  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ text: '' })
  const { data: event } = await supabaseAdmin.from('events').select('*').eq('id', eventId).maybeSingle()
  if (!event) return NextResponse.json({ text: '' })

  const draft = await buildEventBundle(event)
  return NextResponse.json({ text: buildEventSeoText(draft) })
}
