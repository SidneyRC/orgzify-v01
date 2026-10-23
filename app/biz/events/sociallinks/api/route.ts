// THIS FILE GOES IN: app/biz/events/sociallinks/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { findSocialLinkProblem } from '@/lib/findSocialLinkProblem'
import { checkEventAccess } from '@/lib/eventAccess'
import { checkEventEditable, flagPendingEditsIfActive } from '@/lib/eventEditFlag'

const unauth = () => NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
// A refused person is told the event "cannot be found", never "not allowed".
const noEvent = () => NextResponse.json({ error: 'Event not found' }, { status: 404 })
const mayUse = async (req: NextRequest, session: any, eventId: string, mode: 'view' | 'edit') =>
  (await checkEventAccess(req, session, { eventId }, mode)).ok

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return unauth()
  const eventId = req.nextUrl.searchParams.get('event_id')
  if (!eventId) return NextResponse.json({ error: 'event_id required' }, { status: 400 })
  if (!(await mayUse(req, session, eventId, 'view'))) return noEvent()
  const { data, error } = await supabaseAdmin.from('event_social_links').select('*').eq('event_id', eventId).order('display_order')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data: data || [] })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return unauth()
  const body = await req.json()
  const { event_id, platform, url } = body
  if (!event_id || !platform || !url) return NextResponse.json({ error: 'event_id, platform, url required' }, { status: 400 })
  if (!(await mayUse(req, session, event_id, 'edit'))) return noEvent()
  const problem = await findSocialLinkProblem(event_id, platform, url)
  if (problem) return NextResponse.json({ error: problem }, { status: 400 })
  const editable = await checkEventEditable(event_id)
  if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })

  const { data: maxRow } = await supabaseAdmin.from('event_social_links').select('display_order').eq('event_id', event_id).order('display_order', { ascending: false }).limit(1).maybeSingle()
  const nextOrder = (maxRow?.display_order ?? -1) + 1

  const { data, error } = await supabaseAdmin.from('event_social_links').insert({ event_id, platform, url, display_order: nextOrder }).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await flagPendingEditsIfActive(event_id, editable.status!)
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return unauth()
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })
  const { data: row } = await supabaseAdmin.from('event_social_links').select('event_id').eq('id', id).maybeSingle()
  if (!row || !(await mayUse(req, session, row.event_id, 'edit'))) return noEvent()
  const editable = await checkEventEditable(row.event_id)
  if (editable.error) return NextResponse.json({ error: editable.error }, { status: 400 })
  const { error } = await supabaseAdmin.from('event_social_links').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  await flagPendingEditsIfActive(row.event_id, editable.status!)
  return NextResponse.json({ data: true })
}
