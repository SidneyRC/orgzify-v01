// OREV1-048A-API — Geofence Assignment API
// THIS FILE GOES IN: app/(admin)/admin/setup/geofence/assign/api/route.ts
// GET: search locations (country/state/city) + fetch assigned territories for a company
// POST: assign territory | DELETE: remove territory
// All 3 now check login + rights + block editing your own active company

import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { getCompanyRights } from '@/lib/getCompanyRights'
import { isOwnRecord } from '@/lib/companyScope'

// Resolves the active company cookie to a real company id (or null = Super Admin/no context)
async function getActiveCompanyId(req: NextRequest): Promise<string | null> {
  const rawContext = decodeURIComponent(req.cookies.get('orgzify_context')?.value || '')
  const [ctxType, ctxId] = rawContext.split(':')
  if (ctxType !== 'company' || !ctxId) return null
  const { data: company } = await supabaseAdmin
    .from('companies').select('id').eq('process_id', ctxId).maybeSingle()
  return company?.id || null
}

// Checks: logged in, has geofence rights (if inside a company), not editing own record
async function checkEditAccess(req: NextRequest, companyId: string) {
  const session = await getSession(req)
  if (!session) return { ok: false, status: 401, message: 'Unauthorised' }

  const activeCompanyId = await getActiveCompanyId(req)

  // Super Admin / no company context — full access, unchanged
  if (!activeCompanyId) return { ok: true, session }

  const rights = await getCompanyRights(session.user_id, activeCompanyId)
  if (!rights.includes('geofence')) return { ok: false, status: 403, message: 'No access' }

  if (isOwnRecord(activeCompanyId, companyId)) {
    return { ok: false, status: 403, message: 'You cannot edit your own company\'s territory' }
  }

  return { ok: true, session }
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const company_id = searchParams.get('company_id') || ''
  const search = searchParams.get('search') || ''
  const level = searchParams.get('level') || ''

  // Fetch assigned territories for a company
  if (searchParams.get('type') === 'assigned') {
    const { data, error } = await supabaseAdmin
      .from('branch_coverage')
      .select('id, country_id, state_id, city_id, is_active, country_master(id,name)')
      .eq('company_id', company_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const stateIds = (data || []).filter((r: any) => r.state_id).map((r: any) => r.state_id)
    const cityIds = (data || []).filter((r: any) => r.city_id).map((r: any) => r.city_id)
    const allIds = [...new Set([...stateIds, ...cityIds])]
    const { data: locs } = allIds.length ? await supabaseAdmin.from('locations').select('id, name').in('id', allIds) : { data: [] }
    const locMap = Object.fromEntries((locs || []).map((l: any) => [l.id, l.name]))

    const enriched = (data || []).map((r: any) => {
      const countryData = Array.isArray(r.country_master) ? r.country_master[0] : r.country_master
      return {
        id: r.id,
        level: r.city_id ? 'city' : r.state_id ? 'state' : 'country',
        level_name: r.city_id ? (locMap[r.city_id] || '—') : r.state_id ? (locMap[r.state_id] || '—') : (countryData?.name || '—'),
        parent: countryData?.name || ''
      }
    })
    return NextResponse.json({ data: enriched })
  }

  // Search locations — country/state/city — always include country_id
  const results: any[] = []

  if (!level || level === 'country') {
    const q = supabaseAdmin.from('country_master').select('id, name').order('name').limit(20)
    const { data } = search ? await q.ilike('name', `%${search}%`) : await q
    ;(data || []).forEach(r => results.push({ id: r.id, name: r.name, level: 'country', parent: null, country_id: r.id }))
  }

  if (!level || level === 'state') {
    const q = supabaseAdmin.from('locations').select('id, name, country_id, country_master(name)').eq('level', 'state').order('name').limit(20)
    const { data } = search ? await q.ilike('name', `%${search}%`) : await q
    ;(data || []).forEach((r: any) => {
      const countryData = Array.isArray(r.country_master) ? r.country_master[0] : r.country_master
      results.push({ id: r.id, name: r.name, level: 'state', parent: countryData?.name || '', country_id: r.country_id })
    })
  }

  if (!level || level === 'city') {
    const q = supabaseAdmin.from('locations').select('id, name, country_id, country_master(name)').eq('level', 'city').order('name').limit(20)
    const { data } = search ? await q.ilike('name', `%${search}%`) : await q
    ;(data || []).forEach((r: any) => {
      const countryData = Array.isArray(r.country_master) ? r.country_master[0] : r.country_master
      results.push({ id: r.id, name: r.name, level: 'city', parent: countryData?.name || '', country_id: r.country_id })
    })
  }

  // Get all existing assignments to detect ownership
  const { data: allCovered } = await supabaseAdmin.from('branch_coverage').select('company_id, country_id, state_id, city_id, companies(display_name)')
  const owned: Record<string, string> = {}
  ;(allCovered || []).forEach((r: any) => {
    const key = r.city_id || r.state_id || r.country_id
    const companyData = Array.isArray(r.companies) ? r.companies[0] : r.companies
    const name = companyData?.display_name
    if (key && typeof name === 'string') owned[key] = name
  })

  const enriched = results.map(r => ({ ...r, owned_by: owned[r.id] || null }))
  return NextResponse.json({ data: enriched })
}

export async function POST(req: NextRequest) {
  const { company_id, items } = await req.json()
  if (!company_id || !items?.length) return NextResponse.json({ error: 'Missing data' }, { status: 400 })

  const access = await checkEditAccess(req, company_id)
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })
  const session = access.session!

  // For city-level items, fetch their parent state_id from locations
  const cityItems = items.filter((i: any) => i.level === 'city')
  let cityStateMap: Record<string, string> = {}
  if (cityItems.length) {
    const { data: cityLocs } = await supabaseAdmin.from('locations').select('id, parent_id').in('id', cityItems.map((i: any) => i.id))
    cityStateMap = Object.fromEntries((cityLocs || []).map((c: any) => [c.id, c.parent_id]))
  }

  const rows = items.map((item: any) => ({
    company_id,
    country_id: item.country_id,
    state_id: item.level === 'state' ? item.id : (item.level === 'city' ? (cityStateMap[item.id] || null) : null),
    city_id: item.level === 'city' ? item.id : null,
    assigned_by: session.user_id,
    is_active: true
  }))

  const { error } = await supabaseAdmin.from('branch_coverage').insert(rows)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest) {
  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  // Look up which company this territory belongs to, so we can check rights on it
  const { data: existing } = await supabaseAdmin.from('branch_coverage').select('company_id').eq('id', id).maybeSingle()
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const access = await checkEditAccess(req, existing.company_id)
  if (!access.ok) return NextResponse.json({ error: access.message }, { status: access.status })

  const { error } = await supabaseAdmin.from('branch_coverage').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
