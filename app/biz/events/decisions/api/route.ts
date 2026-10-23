// THIS FILE GOES IN: app/biz/events/decisions/api/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Status and latest rejection reason for each event of the organiser's own business.
export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const entityId = req.nextUrl.searchParams.get('entity_id')
  if (!entityId) return NextResponse.json({ error: 'entity_id required' }, { status: 400 })
  const { data: entity } = await supabaseAdmin.from('entities').select('user_id').eq('id', entityId).maybeSingle()
  if (!entity || entity.user_id !== session.user_id) return NextResponse.json({ error: 'Not allowed' }, { status: 403 })

  const { data: events } = await supabaseAdmin.from('events').select('id, name, status, approved_at').eq('entity_id', entityId).neq('status', 'deleted')
  const ids = (events || []).map((e: any) => e.id)
  const { data: notes } = ids.length > 0
    ? await supabaseAdmin.from('module_review_notes').select('record_id, note, reason_id, created_at').eq('module_code', 'event').in('action_type', ['reject', 'reject_correction']).in('record_id', ids).order('created_at', { ascending: false })
    : { data: [] as any[] }
  const reasonIds = [...new Set((notes || []).map((n: any) => n.reason_id).filter(Boolean))]
  const { data: reasons } = reasonIds.length > 0 ? await supabaseAdmin.from('module_status_reasons').select('id, reason_label').in('id', reasonIds) : { data: [] as any[] }
  const label = Object.fromEntries((reasons || []).map((r: any) => [r.id, r.reason_label]))

  const latest: Record<string, any> = {}
  for (const n of notes || []) if (!latest[n.record_id]) latest[n.record_id] = n
  const data = (events || []).map((e: any) => {
    const n = latest[e.id]
    return { ...e, rejected_at: n?.created_at || null, reason: n ? [label[n.reason_id], n.note].filter(Boolean).join(' — ') || null : null }
  })
  return NextResponse.json({ data })
}