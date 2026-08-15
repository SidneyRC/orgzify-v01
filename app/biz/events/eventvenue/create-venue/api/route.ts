// THIS FILE GOES IN: app/biz/events/eventvenue/create-venue/api/route.ts (NEW FILE)
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

const ROOT_COMPANY_ID = '11111111-1111-1111-1111-111111111111'

async function nextVenueProcessId() {
  const { data } = await supabaseAdmin.from('venues').select('process_id').order('process_id', { ascending: false }).limit(1)
  const last = data?.[0]?.process_id
  const n = last ? parseInt(last.replace('VPID', '')) + 1 : 1
  return `VPID${String(n).padStart(4, '0')}`
}

// Same reporting-office match as the Admin route — based on the venue's OWN
// address, never the creator's entity. Kept in sync intentionally.
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

// TODO: raise tracking ticket here — same pattern as Registration, pending Help Desk integration.
export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

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
