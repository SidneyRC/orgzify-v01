// THIS FILE GOES IN: app/biz/events/api/route.ts (REPLACES existing file)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import { getDownlineIds } from '@/lib/companyScope'

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

// Resolves what a non-Super-Admin can see, based on their CURRENT ACTIVE
// company (from the same cookie the app's rights system already uses) —
// not a raw lookup of "any role they hold". Switching active company
// switches what they see, consistent with the rest of the app.
// entityIds/companyIds = null means Super Admin (no restriction).
async function getScopedContext(req: NextRequest, session: any): Promise<{ entityIds: string[] | null; companyIds: string[] | null }> {
  if (session.is_super_admin) return { entityIds: null, companyIds: null }
  const activeCompanyId = await getActiveCompanyId(req.cookies)
  if (!activeCompanyId) return { entityIds: [], companyIds: [] }
  const companyIds = await getDownlineIds(activeCompanyId)
  const { data: userRows } = await supabaseAdmin.from('user_roles').select('user_id').in('company_id', companyIds).eq('is_active', true)
  const userIds = [...new Set((userRows || []).map((r: any) => r.user_id))]
  if (!userIds.length) return { entityIds: [], companyIds }
  const { data: entRows } = await supabaseAdmin.from('entities').select('id').in('user_id', userIds)
  return { entityIds: (entRows || []).map((e: any) => e.id), companyIds }
}

// Resolves entity IDs matching Country/State/City/Reporting Office/Entity Name
// filters. Returns null if no such filter was given (no restriction).
async function getFilteredEntityIds(sp: URLSearchParams): Promise<string[] | null> {
  const entityName = sp.get('entity_name') || ''
  const reportingOffice = sp.get('reporting_office') || ''
  const country = sp.get('country') || ''
  const state = sp.get('state') || ''
  const city = sp.get('city') || ''
  if (!entityName && !reportingOffice && !country && !state && !city) return null

  let entQuery = supabaseAdmin.from('entities').select('id')
  if (entityName) entQuery = entQuery.ilike('display_name', `%${entityName}%`)
  if (reportingOffice) {
    const { data: companies } = await supabaseAdmin.from('companies').select('id').ilike('display_name', `%${reportingOffice}%`)
    const compIds = (companies || []).map((c: any) => c.id)
    if (!compIds.length) return []
    entQuery = entQuery.in('reporting_company_id', compIds)
  }
  const { data: entRows } = await entQuery
  let ids = (entRows || []).map((e: any) => e.id)
  if (!ids.length) return []

  if (country || state || city) {
    const findLocIds = async (name: string, level: string) => {
      const { data } = await supabaseAdmin.from('locations').select('id').ilike('name', `%${name}%`).eq('level', level)
      return (data || []).map((l: any) => l.id)
    }
    let addrQuery = supabaseAdmin.from('entity_addresses').select('entity_id').eq('address_type', 'registered').in('entity_id', ids)
    if (city) { const c = await findLocIds(city, 'city'); if (!c.length) return []; addrQuery = addrQuery.in('city', c) }
    if (state) { const s = await findLocIds(state, 'state'); if (!s.length) return []; addrQuery = addrQuery.in('state', s) }
    if (country) {
      const { data: countries } = await supabaseAdmin.from('country_master').select('id').ilike('name', `%${country}%`)
      const cIds = (countries || []).map((c: any) => c.id)
      if (!cIds.length) return []
      addrQuery = addrQuery.in('country_id', cIds)
    }
    const { data: addrRows } = await addrQuery
    ids = (addrRows || []).map((a: any) => a.entity_id)
  }
  return ids
}

// Resolves event IDs whose scheduled date falls within the given range.
async function getScheduledEventIds(sp: URLSearchParams): Promise<string[] | null> {
  const from = sp.get('scheduled_from') || ''
  const to = sp.get('scheduled_to') || ''
  if (!from && !to) return null
  let q = supabaseAdmin.from('event_venue_dates').select('event_date, event_venues(event_id)')
  if (from) q = q.gte('event_date', from)
  if (to) q = q.lte('event_date', to)
  const { data } = await q
  return [...new Set((data || []).map((d: any) => d.event_venues?.event_id).filter(Boolean))]
}

// Returns the location/country IDs actually used (via registered address) by
// the given entity IDs, for one column. entityIds=null means no restriction.
async function getScopedAddressValues(entityIds: string[] | null, column: 'city' | 'state' | 'country_id') {
  if (entityIds === null) return null
  if (!entityIds.length) return []
  const { data } = await supabaseAdmin.from('entity_addresses').select(column).eq('address_type', 'registered').in('entity_id', entityIds)
  return [...new Set((data || []).map((a: any) => a[column]).filter(Boolean))]
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

  if (sp.get('type') === 'tag_settings') {
    const { data } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'max_event_tags').maybeSingle()
    return NextResponse.json({ max: data ? parseInt(data.value) : 3 })
  }

  if (sp.get('type') === 'tags_search') {
    const q = sp.get('q') || ''
    let q2 = supabaseAdmin.from('event_tags_format').select('id, name').eq('status', 'active').order('display_order')
    if (q) q2 = q2.ilike('name', `%${q}%`)
    const { data } = await q2.limit(8)
    return NextResponse.json({ data: data || [] })
  }

  if (sp.get('type') === 'event_tags') {
    const eventId = sp.get('event_id') || ''
    if (!eventId) return NextResponse.json({ data: [] })
    const { data } = await supabaseAdmin.from('event_tag_assignments')
      .select('tag_id, event_tags_format(id, name)').eq('event_id', eventId)
    const tags = (data || []).map((r: any) => Array.isArray(r.event_tags_format) ? r.event_tags_format[0] : r.event_tags_format).filter(Boolean)
    return NextResponse.json({ data: tags })
  }

  if (sp.get('type') === 'filter_suggestions') {
    const field = sp.get('field') || ''
    const q = sp.get('q') || ''
    if (!q || q.length < 2) return NextResponse.json({ data: [] })
    const { entityIds, companyIds } = await getScopedContext(req, session)

    if (field === 'country') {
      const locIds = await getScopedAddressValues(entityIds, 'country_id')
      if (locIds && !locIds.length) return NextResponse.json({ data: [] })
      let q2 = supabaseAdmin.from('country_master').select('name').ilike('name', `%${q}%`).order('name').limit(8)
      if (locIds) q2 = q2.in('id', locIds)
      const { data } = await q2
      return NextResponse.json({ data: [...new Set((data || []).map((c: any) => c.name))] })
    }
    if (field === 'state' || field === 'city') {
      const locIds = await getScopedAddressValues(entityIds, field)
      if (locIds && !locIds.length) return NextResponse.json({ data: [] })
      let q2 = supabaseAdmin.from('locations').select('name').eq('level', field).ilike('name', `%${q}%`).order('name').limit(8)
      if (locIds) q2 = q2.in('id', locIds)
      const { data } = await q2
      return NextResponse.json({ data: [...new Set((data || []).map((l: any) => l.name))] })
    }
    if (field === 'reporting_office') {
      if (companyIds && !companyIds.length) return NextResponse.json({ data: [] })
      let q2 = supabaseAdmin.from('companies').select('display_name').ilike('display_name', `%${q}%`).order('display_name').limit(8)
      if (companyIds) q2 = q2.in('id', companyIds)
      const { data } = await q2
      return NextResponse.json({ data: (data || []).map((c: any) => c.display_name) })
    }
    if (field === 'entity_name') {
      if (entityIds && !entityIds.length) return NextResponse.json({ data: [] })
      let q2 = supabaseAdmin.from('entities').select('display_name').ilike('display_name', `%${q}%`).order('display_name').limit(8)
      if (entityIds) q2 = q2.in('id', entityIds)
      const { data } = await q2
      return NextResponse.json({ data: (data || []).map((e: any) => e.display_name) })
    }
    return NextResponse.json({ data: [] })
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
    const statusList = status ? status.split(',').filter(Boolean) : []
    const createdFrom = sp.get('created_from') || ''
    const createdTo = sp.get('created_to') || ''

    const { entityIds: scopedIds } = await getScopedContext(req, session)
    if (scopedIds && scopedIds.length === 0) return NextResponse.json({ data: [], total: 0 })

    const filteredIds = await getFilteredEntityIds(sp)
    if (filteredIds && filteredIds.length === 0) return NextResponse.json({ data: [], total: 0 })

    let finalEntityIds: string[] | null = null
    if (scopedIds && filteredIds) finalEntityIds = scopedIds.filter(id => filteredIds.includes(id))
    else finalEntityIds = scopedIds || filteredIds
    if (finalEntityIds && finalEntityIds.length === 0) return NextResponse.json({ data: [], total: 0 })

    const scheduledIds = await getScheduledEventIds(sp)
    if (scheduledIds && scheduledIds.length === 0) return NextResponse.json({ data: [], total: 0 })

    let query = supabaseAdmin.from('events').select(
      'id, process_id, slug, name, status, under_review, booking_open, event_status, entity_id, created_at', { count: 'exact' }
    )
    if (search) query = query.or(`name.ilike.%${search}%,process_id.ilike.%${search}%`)
    if (statusList.length) query = query.in('status', statusList)
    else query = query.neq('status', 'deleted')
    if (finalEntityIds) query = query.in('entity_id', finalEntityIds)
    if (scheduledIds) query = query.in('id', scheduledIds)
    if (createdFrom) query = query.gte('created_at', createdFrom)
    if (createdTo) query = query.lte('created_at', `${createdTo}T23:59:59`)

    const { data: rows, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!rows?.length) return NextResponse.json({ data: [], total: 0 })

    const entityIds2 = [...new Set(rows.map(r => r.entity_id).filter(Boolean))]
    const { data: entities } = entityIds2.length
      ? await supabaseAdmin.from('entities').select('id, slug, display_name, reporting_company_id').in('id', entityIds2)
      : { data: [] }
    const entityMap = Object.fromEntries((entities || []).map((e: any) => [e.id, e]))

    const companyIds2 = [...new Set((entities || []).map((e: any) => e.reporting_company_id).filter(Boolean))]
    const { data: companies } = companyIds2.length
      ? await supabaseAdmin.from('companies').select('id, display_name').in('id', companyIds2)
      : { data: [] }
    const companyMap = Object.fromEntries((companies || []).map((c: any) => [c.id, c.display_name]))

    const { data: addrRows } = entityIds2.length
      ? await supabaseAdmin.from('entity_addresses').select('entity_id, city').eq('address_type', 'registered').in('entity_id', entityIds2)
      : { data: [] }
    const cityLocIds = [...new Set((addrRows || []).map((a: any) => a.city).filter(Boolean))]
    const { data: cityLocs } = cityLocIds.length
      ? await supabaseAdmin.from('locations').select('id, name').in('id', cityLocIds)
      : { data: [] }
    const cityNameMap = Object.fromEntries((cityLocs || []).map((l: any) => [l.id, l.name]))
    const entityCityMap = Object.fromEntries((addrRows || []).map((a: any) => [a.entity_id, cityNameMap[a.city] || '']))

    const data = rows.map(r => ({
      ...r,
      entity_slug: entityMap[r.entity_id]?.slug || '',
      entity_name: entityMap[r.entity_id]?.display_name || '',
      reporting_office: companyMap[entityMap[r.entity_id]?.reporting_company_id] || '',
      city: entityCityMap[r.entity_id] || ''
    }))

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
      const { min_age, event_duration_minutes, refund_allowed, description, terms_conditions, tag_ids } = body
      if (!id || !description) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
      if (!tag_ids || !tag_ids.length) return NextResponse.json({ error: 'At least one tag is required' }, { status: 400 })
      const { data: setting } = await supabaseAdmin.from('platform_settings').select('value').eq('key', 'max_event_tags').maybeSingle()
      const maxTags = setting ? parseInt(setting.value) : 3
      if (tag_ids.length > maxTags) return NextResponse.json({ error: `Maximum ${maxTags} tags allowed` }, { status: 400 })

      const payload: any = {
        min_age: min_age || null, event_duration_minutes: event_duration_minutes || null,
        refund_allowed: !!refund_allowed, description, terms_conditions, updated_at: new Date().toISOString()
      }
      if (existing?.status === 'active') payload.under_review = true
      const { data, error } = await supabaseAdmin.from('events').update(payload).eq('id', id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })

      await supabaseAdmin.from('event_tag_assignments').delete().eq('event_id', id)
      await supabaseAdmin.from('event_tag_assignments').insert(tag_ids.map((tag_id: string) => ({ event_id: id, tag_id })))

      return NextResponse.json({ data })
    }
  }

  if (action === 'submit_for_approval') {
    const { id } = body
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
    const { data: existing } = await supabaseAdmin.from('events').select('status').eq('id', id).maybeSingle()
    if (!existing) return NextResponse.json({ error: 'Event not found' }, { status: 404 })
    if (existing.status !== 'draft') return NextResponse.json({ error: 'Only Draft events can be submitted for approval' }, { status: 400 })
    const { data, error } = await supabaseAdmin.from('events').update({ status: 'pending', updated_at: new Date().toISOString() }).eq('id', id).select().single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
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
