// THIS FILE GOES IN: app/biz/pages/api/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Confirms the logged-in person owns this active organiser/academy account.
async function getOwnedEntity(req: NextRequest, entityId: string | null) {
  const session = await getSession(req)
  if (!session) return { error: 'Unauthorised', status: 401 }
  if (!entityId) return { error: 'entity_id required', status: 400 }
  const { data: entity } = await supabaseAdmin.from('entities').select('id, display_name, user_id, status').eq('id', entityId).maybeSingle()
  if (!entity || entity.user_id !== session.user_id) return { error: 'Not allowed', status: 403 }
  if (entity.status !== 'active') return { error: 'Account is not active', status: 403 }
  return { session, entity }
}

export async function GET(req: NextRequest) {
  const a = await getOwnedEntity(req, req.nextUrl.searchParams.get('entity_id'))
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status })
  const { data: page } = await supabaseAdmin.from('entity_pages').select('sponsor_id, pending_logo_url, change_note').eq('entity_id', a.entity.id).maybeSingle()
  if (!page?.sponsor_id) return NextResponse.json({ data: { status: 'none', logo_url: null, reason: null } })

  const { data: sp } = await supabaseAdmin.from('sponsors').select('status, logo_url').eq('id', page.sponsor_id).maybeSingle()
  let reason: string | null = null
  if (sp?.status === 'rejected') {
    const { data: note } = await supabaseAdmin.from('module_review_notes').select('note, reason_id')
      .eq('module_code', 'sponsors').eq('record_id', page.sponsor_id).eq('action_type', 'reject')
      .order('created_at', { ascending: false }).limit(1).maybeSingle()
    let label = ''
    if (note?.reason_id) {
      const { data: r } = await supabaseAdmin.from('module_status_reasons').select('reason_label').eq('id', note.reason_id).maybeSingle()
      label = r?.reason_label || ''
    }
    reason = [label, note?.note].filter(Boolean).join(' — ') || null
  }
  return NextResponse.json({ data: { status: sp?.status || 'none', logo_url: sp?.logo_url || null, reason: reason || page.change_note || null, pending_url: page.pending_logo_url || null } })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const a = await getOwnedEntity(req, body.entity_id)
  if ('error' in a) return NextResponse.json({ error: a.error }, { status: a.status })
  const { entity, session } = a

  const { data: page } = await supabaseAdmin.from('entity_pages').select('id, sponsor_id').eq('entity_id', entity.id).maybeSingle()
  const { data: sp } = page?.sponsor_id
    ? await supabaseAdmin.from('sponsors').select('id, status').eq('id', page.sponsor_id).maybeSingle()
    : { data: null }

  if (body.action === 'save_logo') {
    if (!body.logo_url) return NextResponse.json({ error: 'Logo is required' }, { status: 400 })
    if (sp?.status === 'approved') {
      const { error } = await supabaseAdmin.from('entity_pages').update({ pending_logo_url: body.logo_url, change_note: null, updated_at: new Date().toISOString() }).eq('entity_id', entity.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: true })
    }
    if (sp) {
      const { error } = await supabaseAdmin.from('sponsors').update({ logo_url: body.logo_url, name: entity.display_name, status: 'pending' }).eq('id', sp.id)
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data: true })
    }
    const { data: created, error } = await supabaseAdmin.from('sponsors')
      .insert({ name: entity.display_name, logo_url: body.logo_url, status: 'pending', is_enabled: true, created_by: session.user_id }).select('id').single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    const { error: linkError } = await supabaseAdmin.from('entity_pages').insert({ entity_id: entity.id, sponsor_id: created.id })
    if (linkError) {
      await supabaseAdmin.from('sponsors').delete().eq('id', created.id)
      return NextResponse.json({ error: linkError.message }, { status: 500 })
    }
    return NextResponse.json({ data: true })
  }

  if (body.action === 'remove_logo') {
    if (!sp) return NextResponse.json({ data: true })
    if (sp.status === 'approved') return NextResponse.json({ error: 'An approved logo cannot be removed.' }, { status: 400 })
    await supabaseAdmin.from('entity_pages').delete().eq('entity_id', entity.id)
    await supabaseAdmin.from('sponsors').delete().eq('id', sp.id)
    return NextResponse.json({ data: true })
  }

    if (body.action === 'cancel_change') {
    await supabaseAdmin.from('entity_pages').update({ pending_logo_url: null }).eq('entity_id', entity.id)
    return NextResponse.json({ data: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}