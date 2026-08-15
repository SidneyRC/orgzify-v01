// GOES IN: app/(admin)/admin/master/venue/api/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import { getDownlineIds } from '@/lib/companyScope'
import { VIRTUAL_VENUE_ID } from '@/lib/constants'

const ROOT_COMPANY_ID = '11111111-1111-1111-1111-111111111111'

async function hasVenueRight(req: NextRequest, session: any, right: string) {
  const activeCompanyId = await getActiveCompanyId(req.cookies)
  if (session.is_super_admin && !activeCompanyId) return true
  if (!activeCompanyId) return false
  const rights = await getFullCompanyRights(session.user_id, activeCompanyId)
  return !!rights['venue']?.[right as keyof typeof rights['venue']]
}

async function nextVenueProcessId() {
  const { data } = await supabaseAdmin.from('venues').select('process_id').order('process_id', { ascending: false }).limit(1)
  const last = data?.[0]?.process_id
  const n = last ? parseInt(last.replace('VPID', '')) + 1 : 1
  return `VPID${String(n).padStart(4, '0')}`
}

// Works out which Orgzify company is responsible for a Venue, based on the
// Venue's OWN address — never the creator's company. Same table and same
// City → State → Country priority as Entity's reporting-office match.
// No match found = falls back to Root Company (no ticket/holding queue yet).
async function matchVenueReportingOffice(cityId: string | null, stateId: string | null, countryId: string | null) {
  let branch: any = null
  if (cityId) {
    const { data } = await supabaseAdmin.from('branch_coverage').select('company_id').eq('city_id', cityId).eq('is_active', true).maybeSingle()
    branch = data
  }
  if (!branch && stateId) {
    const { data } = await supabaseAdmin.from('branch_coverage').select('company_id').eq('state_id', stateId).eq('is_active', true).maybeSingle()
    branch = data
  }
  if (!branch && countryId) {
    const { data } = await supabaseAdmin.from('branch_coverage').select('company_id')
      .eq('country_id', countryId).is('state_id', null).is('city_id', null).eq('is_active', true).maybeSingle()
    branch = data
  }
  return branch?.company_id || ROOT_COMPANY_ID
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { searchParams } = new URL(req.url)

  if (searchParams.get('type') === 'offices') {
    const { data } = await supabaseAdmin.from('companies').select('id, display_name').order('display_name')
    return NextResponse.json({ data: data || [] })
  }
  if (searchParams.get('type') === 'entities') {
    const { data } = await supabaseAdmin.from('entities').select('id, display_name').order('display_name')
    return NextResponse.json({ data: data || [] })
  }
  // Type-and-search for Reporting Office filter. Master Company hidden for non-Super-Admins.
  if (searchParams.get('type') === 'search_offices') {
    const q = searchParams.get('q') || ''
    let query = supabaseAdmin.from('companies').select('id, display_name').ilike('display_name', `%${q}%`).limit(20)
    if (!session.is_super_admin) query = query.neq('id', ROOT_COMPANY_ID)
    const { data } = await query
    return NextResponse.json({ data: data || [] })
  }
  // Matches Process ID, Entity Unique ID, or Name — whichever the user types.
  if (searchParams.get('type') === 'search_entities') {
    const q = searchParams.get('q') || ''
    const { data } = await supabaseAdmin.from('entities').select('id, process_id, entity_unique_id, display_name')
      .or(`display_name.ilike.%${q}%,process_id.ilike.%${q}%,entity_unique_id.ilike.%${q}%`).limit(20)
    return NextResponse.json({ data: data || [] })
  }
  // Server-side proxy to OpenStreetMap's free Nominatim search — no API key.
  // Nominatim requires a real User-Agent identifying the app (their usage policy).
  if (searchParams.get('type') === 'search_location') {
    const q = searchParams.get('q') || ''
    if (q.length < 3) return NextResponse.json({ data: [] })
    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(q)}`, {
      headers: { 'User-Agent': 'Orgzify-Admin/1.0 (venue-location-search)' }
    })
    if (!res.ok) return NextResponse.json({ data: [] })
    const data = await res.json()
    return NextResponse.json({ data })
  }

  if (searchParams.get('type') === 'status_reasons') {
    const statusCode = searchParams.get('status_code') || 'rejected'
    const { data } = await supabaseAdmin.from('module_status_reasons')
      .select('id, reason_label').eq('module_code', 'venue').eq('status_code', statusCode).eq('is_active', true).order('sort_order')
    return NextResponse.json({ data: data || [] })
  }

  if (!(await hasVenueRight(req, session, 'can_view'))) return NextResponse.json({ error: 'You do not have permission to view venues.' }, { status: 403 })

  const singleId = searchParams.get('id')
  if (singleId) {
    if (singleId === VIRTUAL_VENUE_ID) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    const { data } = await supabaseAdmin.from('venues').select('*').eq('id', singleId).maybeSingle()
    if (!data) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
    const [{ data: city }, { data: district }, { data: state }, { data: exEntities }, { data: reviewNotes }] = await Promise.all([
      data.city_id ? supabaseAdmin.from('locations').select('name').eq('id', data.city_id).maybeSingle() : Promise.resolve({ data: null }),
      data.district_id ? supabaseAdmin.from('locations').select('name').eq('id', data.district_id).maybeSingle() : Promise.resolve({ data: null }),
      data.state_id ? supabaseAdmin.from('locations').select('name').eq('id', data.state_id).maybeSingle() : Promise.resolve({ data: null }),
      (data.exclusive_entity_ids || []).length ? supabaseAdmin.from('entities').select('id, process_id, entity_unique_id, display_name').in('id', data.exclusive_entity_ids) : Promise.resolve({ data: [] }),
      supabaseAdmin.from('module_review_notes').select('action_type, note, created_at').eq('module_code', 'venue').eq('record_id', singleId).order('created_at', { ascending: false }).limit(1),
    ])
    const entityLabels = Object.fromEntries((exEntities || []).map((e: any) => [e.id, `${e.entity_unique_id || e.process_id} | ${e.display_name}`]))
    return NextResponse.json({ data: { ...data, city_name: city?.name || '', district_name: district?.name || '', state_name: state?.name || '', entity_labels: entityLabels, latest_review_note: reviewNotes?.[0] || null } })
  }

  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '20')
  const offset = (page - 1) * limit
  const search = searchParams.get('search') || ''
  const status = searchParams.get('status') || ''
  const visibility = searchParams.get('visibility') || ''
  const companyId = searchParams.get('company_id') || ''
  const entityId = searchParams.get('entity_id') || ''
  const activeCompanyId = await getActiveCompanyId(req.cookies)

  let query = supabaseAdmin.from('venues').select(
    'id, process_id, internal_name, external_name, city_id, visibility, exclusive_entity_ids, company_id, status', { count: 'exact' }
  ).neq('id', VIRTUAL_VENUE_ID)
  if (search) query = query.or(`internal_name.ilike.%${search}%,external_name.ilike.%${search}%,process_id.ilike.%${search}%`)
  if (status) query = query.eq('status', status); else query = query.neq('status', 'archived')
  if (visibility) query = query.eq('visibility', visibility)
  if (companyId) query = query.eq('company_id', companyId)
  if (entityId) query = query.contains('exclusive_entity_ids', [entityId])
  if (activeCompanyId) {
  const scopedIds = await getDownlineIds(activeCompanyId)
  query = query.in('company_id', scopedIds)
  }

  const { data: rows, error, count } = await query.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!rows?.length) return NextResponse.json({ data: [], total: 0 })

  const cityIds = [...new Set(rows.map((r: any) => r.city_id).filter(Boolean))]
  const companyIds = [...new Set(rows.map((r: any) => r.company_id).filter(Boolean))]
  const entityIds = [...new Set(rows.flatMap((r: any) => r.exclusive_entity_ids || []))]
  const [{ data: cities }, { data: companyRows }, { data: entityRows }] = await Promise.all([
    cityIds.length ? supabaseAdmin.from('locations').select('id, name').in('id', cityIds) : Promise.resolve({ data: [] }),
    companyIds.length ? supabaseAdmin.from('companies').select('id, display_name').in('id', companyIds) : Promise.resolve({ data: [] }),
    entityIds.length ? supabaseAdmin.from('entities').select('id, display_name').in('id', entityIds) : Promise.resolve({ data: [] }),
  ])
  const cityMap = Object.fromEntries((cities || []).map((c: any) => [c.id, c.name]))
  const companyMap = Object.fromEntries((companyRows || []).map((c: any) => [c.id, c.display_name]))
  const entityMap = Object.fromEntries((entityRows || []).map((e: any) => [e.id, e.display_name]))

  const data = rows.map((r: any) => ({
    ...r, city_name: cityMap[r.city_id] || null,
    reporting_label: r.visibility === 'exclusive'
      ? (r.exclusive_entity_ids || []).map((id: string) => entityMap[id]).filter(Boolean).join(', ')
      : (companyMap[r.company_id] || null)
  }))
  return NextResponse.json({ data, total: count })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  if (!(await hasVenueRight(req, session, 'can_create'))) return NextResponse.json({ error: 'You do not have permission to create venues.' }, { status: 403 })

  const body = await req.json()
  const companyId = await matchVenueReportingOffice(body.city_id || null, body.state_id || null, body.country_id || null)
  const processId = await nextVenueProcessId()

  const { data, error } = await supabaseAdmin.from('venues').insert({
    process_id: processId, company_id: companyId, created_by: session.user_id, status: 'pending',
    internal_name: body.internal_name, external_name: body.external_name,
    pincode: body.pincode, area: body.area, line1: body.line1, line2: body.line2,
    city_id: body.city_id || null, district_id: body.district_id || null, state_id: body.state_id || null, country_id: body.country_id || null, landmark: body.landmark,
    latitude: body.latitude, longitude: body.longitude, location_display_name: body.location_display_name, reference_link: body.reference_link || null,
    facilities_amenities: body.facilities_amenities || [],
    capacity: body.capacity, visibility: body.visibility, exclusive_entity_ids: body.exclusive_entity_ids || [],
  }).select().single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { id, action, status, expected_status, reason_id, reason_note } = body
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (id === VIRTUAL_VENUE_ID) return NextResponse.json({ error: 'This is a system venue and cannot be modified.' }, { status: 403 })

  const REVIEW_ACTIONS: Record<string, string> = { approve: 'active', reject: 'rejected', suspend: 'suspended', block: 'blocked' }

  if (action === 'restore') {
    if (!(await hasVenueRight(req, session, 'can_restore'))) return NextResponse.json({ error: 'No permission to restore.' }, { status: 403 })
    const { error } = await supabaseAdmin.from('venues').update({ status: 'inactive', previous_status: null, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: { status: 'inactive' } })
  }

  if (action === 'delete') {
    if (!(await hasVenueRight(req, session, 'can_delete'))) return NextResponse.json({ error: 'No permission to delete.' }, { status: 403 })
    const { data: current } = await supabaseAdmin.from('venues').select('status').eq('id', id).maybeSingle()
    const { error } = await supabaseAdmin.from('venues').update({ previous_status: current?.status, status: 'archived', updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: { status: 'archived' } })
  }

  // Approve / Reject / Suspend / Block — the approval flow. Reject, Suspend,
  // and Block all require a reason; Approve does not. No tickets/emails yet —
  // that wiring is a separate future step against the new Help Desk.
  if (action && REVIEW_ACTIONS[action]) {
    if (!(await hasVenueRight(req, session, 'can_approve'))) return NextResponse.json({ error: 'You do not have permission to approve/reject venues.' }, { status: 403 })
    if (action !== 'approve' && !reason_id && !reason_note) return NextResponse.json({ error: 'A reason is required' }, { status: 400 })

    if (expected_status) {
      const { data: current } = await supabaseAdmin.from('venues').select('status').eq('id', id).maybeSingle()
      if (current && current.status !== expected_status) return NextResponse.json({ error: 'conflict', current_status: current.status }, { status: 409 })
    }

    const newStatus = REVIEW_ACTIONS[action]
    const patch: any = { status: newStatus, updated_at: new Date().toISOString() }
    if (action === 'approve') { patch.approved_by = session.user_id; patch.approved_at = new Date().toISOString() }
    const { error } = await supabaseAdmin.from('venues').update(patch).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    if (action !== 'approve') {
      await supabaseAdmin.from('module_review_notes').insert({
        module_code: 'venue', record_id: id, action_type: action, reason_id: reason_id || null, note: reason_note || null, created_by: session.user_id
      })
    }
    return NextResponse.json({ data: { status: newStatus } })
  }

  if (status === 'active' || status === 'inactive') {
    if (!(await hasVenueRight(req, session, 'can_activate'))) return NextResponse.json({ error: 'No permission to activate/disable.' }, { status: 403 })
    const { data: current } = await supabaseAdmin.from('venues').select('status').eq('id', id).maybeSingle()
    if (!current || (current.status !== 'active' && current.status !== 'inactive')) {
      return NextResponse.json({ error: 'Venue must be approved before it can be activated.' }, { status: 400 })
    }
    const { error } = await supabaseAdmin.from('venues').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data: { status } })
  }

  if (!(await hasVenueRight(req, session, 'can_edit'))) return NextResponse.json({ error: 'No permission to edit venues.' }, { status: 403 })
  const companyId = await matchVenueReportingOffice(body.city_id || null, body.state_id || null, body.country_id || null)
  const { data, error } = await supabaseAdmin.from('venues').update({
    internal_name: body.internal_name, external_name: body.external_name,
    pincode: body.pincode, area: body.area, line1: body.line1, line2: body.line2,
    city_id: body.city_id || null, district_id: body.district_id || null, state_id: body.state_id || null, country_id: body.country_id || null, landmark: body.landmark,
    latitude: body.latitude, longitude: body.longitude, location_display_name: body.location_display_name, reference_link: body.reference_link || null,
    facilities_amenities: body.facilities_amenities || [],
    capacity: body.capacity, visibility: body.visibility, exclusive_entity_ids: body.exclusive_entity_ids || [],
    company_id: companyId,
    updated_at: new Date().toISOString(),
  }).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

export async function DELETE(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  if (id === VIRTUAL_VENUE_ID) return NextResponse.json({ error: 'This is a system venue and cannot be deleted.' }, { status: 403 })
  if (!(await hasVenueRight(req, session, 'can_hard_delete'))) return NextResponse.json({ error: 'No permission to permanently delete.' }, { status: 403 })

  const { data: venue } = await supabaseAdmin.from('venues').select('status').eq('id', id).maybeSingle()
  if (!venue) return NextResponse.json({ error: 'Venue not found' }, { status: 404 })
  if (venue.status !== 'archived') return NextResponse.json({ error: 'Only archived venues can be permanently deleted.' }, { status: 400 })

  const { error } = await supabaseAdmin.from('venues').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}