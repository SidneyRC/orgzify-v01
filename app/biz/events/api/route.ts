// THIS FILE GOES IN: app/biz/events/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'

async function hasEventRight(req: NextRequest, session: any, right: string) {
  if (session.is_super_admin) return true
  const activeCompanyId = await getActiveCompanyId(req.cookies)
  if (!activeCompanyId) return false
  const rights = await getFullCompanyRights(session.user_id, activeCompanyId)
  return !!rights['events']?.[right as keyof typeof rights['events']]
}

async function nextProcessId() {
  const { data } = await supabaseAdmin
    .from('events').select('process_id').order('process_id', { ascending: false }).limit(1)
  const last = data?.[0]?.process_id
  const n = last ? parseInt(last.replace('EVID', '')) + 1 : 1
  return `EVID${String(n).padStart(4, '0')}`
}

async function generateSlug(name: string, excludeId?: string) {
  const base = name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  let slug = base, n = 0
  while (true) {
    let q = supabaseAdmin.from('events').select('id').eq('slug', slug)
    if (excludeId) q = q.neq('id', excludeId)
    const { data } = await q.maybeSingle()
    if (!data) return slug
    n += 1
    slug = `${base}-${String(n).padStart(2, '0')}`
  }
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const sp = req.nextUrl.searchParams

  if (sp.get('type') === 'categories') {
    const { data, error } = await supabaseAdmin
      .from('event_categories').select('id, parent_id, level, name')
      .eq('status', 'active').order('display_order')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: data || [] })
  }

  if (sp.get('type') === 'status_reasons') {
    const statusCode = sp.get('status_code') || 'rejected'
    const { data } = await supabaseAdmin.from('module_status_reasons')
      .select('id, reason_label').eq('module_code', 'event').eq('status_code', statusCode).eq('is_active', true).order('sort_order')
    return NextResponse.json({ data: data || [] })
  }

  const ref = sp.get('process_id')
  if (ref) {
    const { data, error } = await supabaseAdmin.from('events').select('*').eq('process_id', ref).maybeSingle()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (sp.get('type') === 'admin_list') {
    const page = parseInt(sp.get('page') || '1')
    const limit = parseInt(sp.get('limit') || '20')
    const offset = (page - 1) * limit
    const search = sp.get('search') || ''
    const status = sp.get('status') || ''

    let query = supabaseAdmin.from('events').select(
      'id, process_id, slug, name, status, under_review, booking_open, event_status, entity_id, created_at', { count: 'exact' }
    )
    if (search) query = query.or(`name.ilike.%${search}%,process_id.ilike.%${search}%`)
    if (status) query = query.eq('status', status)
    else query = query.neq('status', 'deleted')

    const { data: rows, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!rows?.length) return NextResponse.json({ data: [], total: 0 })

    const entityIds = [...new Set(rows.map(r => r.entity_id).filter(Boolean))]
    const { data: entities } = entityIds.length
      ? await supabaseAdmin.from('entities').select('id, slug').in('id', entityIds)
      : { data: [] }
    const slugMap = Object.fromEntries((entities || []).map((e: any) => [e.id, e.slug]))
    const data = rows.map(r => ({ ...r, entity_slug: slugMap[r.entity_id] || '' }))

    return NextResponse.json({ data, total: count })
  }

  if (sp.get('type') === 'list') {
    const entityId = sp.get('entity_id')
    const tab = sp.get('tab') || 'draft'
    if (!entityId) return NextResponse.json({ error: 'Missing entity_id' }, { status: 400 })
    const search = sp.get('search') || ''
    const page = parseInt(sp.get('page') || '1')
    const limit = parseInt(sp.get('limit') || '10')
    const offset = (page - 1) * limit

    let query = supabaseAdmin.from('events')
      .select('id, process_id, name, slug, status, published, booking_open, under_review, event_format, updated_at', { count: 'exact' })
      .eq('entity_id', entityId).neq('status', 'deleted')
    if (search) query = query.or(`name.ilike.%${search}%,process_id.ilike.%${search}%`)

    if (tab === 'draft') query = query.in('status', ['draft', 'pending']).order('updated_at', { ascending: false })
    else if (tab === 'unlisted') query = query.eq('status', 'active').eq('published', false).order('updated_at', { ascending: false })
    else if (tab === 'live' || tab === 'closed') query = query.eq('status', 'active').eq('published', true)
    else return NextResponse.json({ error: 'Invalid tab' }, { status: 400 })

    if (tab === 'draft' || tab === 'unlisted') query = query.range(offset, offset + limit - 1)

    const { data: events, error, count } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!events?.length) return NextResponse.json({ data: [], total: count || 0 })

    if (tab === 'draft' || tab === 'unlisted') return NextResponse.json({ data: events, total: count || 0 })

    if (tab === 'live' || tab === 'closed') {
      const ids = events.map(e => e.id)
      const { data: times } = await supabaseAdmin
        .from('event_venue_times')
        .select('start_time, event_venue_dates(event_date, event_venues(event_id))')
      const now = new Date()
      const withDates = (times || []).map((t: any) => ({
        event_id: t.event_venue_dates?.event_venues?.event_id,
        at: new Date(`${t.event_venue_dates?.event_date}T${t.start_time}`)
      })).filter(t => ids.includes(t.event_id))

      const soonestByEvent = new Map<string, Date>()
      withDates.forEach(t => {
        const existing = soonestByEvent.get(t.event_id)
        if (!existing || t.at < existing) soonestByEvent.set(t.event_id, t.at)
      })

      const filtered = events.filter(e => {
        const at = soonestByEvent.get(e.id)
        if (!at) return false
        return tab === 'live' ? at >= now : at < now
      }).sort((a, b) => {
        const aAt = soonestByEvent.get(a.id)!.getTime(), bAt = soonestByEvent.get(b.id)!.getTime()
        return tab === 'live' ? aAt - bAt : bAt - aAt
      })
      const paged = filtered.slice(offset, offset + limit)
      return NextResponse.json({ data: paged, total: filtered.length })
    }

    return NextResponse.json({ data: events, total: count || 0 })
  }

  return NextResponse.json({ error: 'Missing query' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { action } = body

  if (action === 'save_step2_info' || action === 'save_step3_additional') {
    const { id } = body
    let existing: any = null
    if (id) {
      const { data } = await supabaseAdmin.from('events').select('status, name').eq('id', id).maybeSingle()
      existing = data
      if (existing?.status === 'pending') {
        return NextResponse.json({ error: 'This event is awaiting Admin review and cannot be edited right now.' }, { status: 400 })
      }
    }

    if (action === 'save_step2_info') {
      const { entity_id, event_format, name, category_id, sub_category_id, languages, visibility } = body
      if (!entity_id || !name || !event_format) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      if (name.length > 50) return NextResponse.json({ error: 'Name must be 50 characters or less' }, { status: 400 })

      const payload: any = {
        event_format, name, category_id: category_id || null, sub_category_id: sub_category_id || null,
        languages: languages || null, visibility, updated_at: new Date().toISOString()
      }
      if (existing?.status === 'active') payload.under_review = true

      if (id) {
        if (existing && existing.name !== name && (existing.status === 'draft' || existing.status === 'active')) {
          payload.slug = await generateSlug(name, id)
        }
        const { data, error } = await supabaseAdmin.from('events').update(payload).eq('id', id).select().single()
        if (error) return NextResponse.json({ error: error.message }, { status: 500 })
        return NextResponse.json({ data })
      }

      const { data: entity } = await supabaseAdmin.from('entities').select('reporting_company_id').eq('id', entity_id).maybeSingle()
      const process_id = await nextProcessId()
      const slug = await generateSlug(name)

      const { data, error } = await supabaseAdmin.from('events').insert({
        ...payload, process_id, slug, entity_id, status: 'draft',
        reporting_office_id: entity?.reporting_company_id || null, created_by: session.user_id
      }).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data })
    }

    if (action === 'save_step3_additional') {
      const { min_age, event_duration_minutes, refund_allowed, description, terms_conditions } = body
      if (!id || !description) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      const payload: any = {
        min_age: min_age || null, event_duration_minutes: event_duration_minutes || null,
        refund_allowed: !!refund_allowed, description, terms_conditions, updated_at: new Date().toISOString()
      }
      if (existing?.status === 'active') payload.under_review = true
      const { data, error } = await supabaseAdmin.from('events').update(payload).eq('id', id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      return NextResponse.json({ data })
    }
  }

  if (action === 'save_social_links') {
    const { id, social_facebook_url, social_instagram_url, social_x_url, social_youtube_url, social_website_url } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { data: existing } = await supabaseAdmin.from('events').select('status').eq('id', id).maybeSingle()
    if (existing?.status === 'pending') return NextResponse.json({ error: "This event is awaiting Admin review and can't be edited right now." }, { status: 400 })
    const payload: any = {
      social_facebook_url: social_facebook_url || null, social_instagram_url: social_instagram_url || null,
      social_x_url: social_x_url || null, social_youtube_url: social_youtube_url || null,
      social_website_url: social_website_url || null, updated_at: new Date().toISOString()
    }
    if (existing?.status === 'active') payload.under_review = true
    const { data, error } = await supabaseAdmin.from('events').update(payload).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { id, action, reason_id, reason_note } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: event } = await supabaseAdmin.from('events').select('*').eq('id', id).maybeSingle()
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  if (action === 'toggle_booking') {
    if (event.status !== 'active') return NextResponse.json({ error: 'Booking toggle only applies to active events' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('events')
      .update({ booking_open: !event.booking_open, updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (action === 'approve') {
    if (!(await hasEventRight(req, session, 'can_approve'))) {
      return NextResponse.json({ error: 'You do not have permission to approve events.' }, { status: 403 })
    }
    if (event.status !== 'pending' && !(event.status === 'active' && event.under_review)) {
      return NextResponse.json({ error: 'Event is not awaiting approval' }, { status: 400 })
    }

    let slug = event.slug
    const wasFirstApproval = event.status === 'pending'
    const snapshot = event.last_approved_snapshot as any
    const nameChanged = !wasFirstApproval && snapshot && snapshot.name !== event.name
    if (nameChanged) slug = await generateSlug(event.name, id)

    const fields: any = {
      status: 'active', is_approved: true, approved_by: session.user_id, approved_at: new Date().toISOString(),
      under_review: false, slug, last_approved_snapshot: { ...event, slug },
      updated_at: new Date().toISOString()
    }
    if (wasFirstApproval) fields.booking_open = true

    const { data, error } = await supabaseAdmin.from('events').update(fields).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (action === 'reject') {
    if (!(await hasEventRight(req, session, 'can_approve'))) {
      return NextResponse.json({ error: 'You do not have permission to reject events.' }, { status: 403 })
    }
    if (!reason_id && !reason_note) return NextResponse.json({ error: 'A reason is required' }, { status: 400 })

    const isCorrection = event.status === 'active' && event.under_review
    const fields: any = { updated_at: new Date().toISOString() }
    if (isCorrection) fields.under_review = false
    else fields.status = 'rejected'

    const { data, error } = await supabaseAdmin.from('events').update(fields).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabaseAdmin.from('module_review_notes').insert({
      module_code: 'event', record_id: id, action_type: isCorrection ? 'reject_correction' : 'reject',
      reason_id: reason_id || null, note: reason_note || null, created_by: session.user_id
    })
    return NextResponse.json({ data })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { data: event } = await supabaseAdmin.from('events').select('status').eq('id', id).maybeSingle()
  if (!event) return NextResponse.json({ error: 'Event not found' }, { status: 404 })

  if (!['draft', 'pending'].includes(event.status)) {
    return NextResponse.json({ error: 'Only Draft or Pending events can be deleted' }, { status: 400 })
  }
  // FUTURE: block delete here if event has ticket/participant rows once Ticket Categories (Build 4) exists.

  const { error } = await supabaseAdmin.from('events')
    .update({ status: 'deleted', updated_at: new Date().toISOString() }).eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
