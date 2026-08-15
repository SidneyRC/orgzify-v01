import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { sendEntityStatusEmail } from '@/lib/sendEntityStatusEmail'

async function nextProcessId() {
  const { data } = await supabaseAdmin
    .from('entities').select('process_id').order('process_id', { ascending: false }).limit(1)
  const last = data?.[0]?.process_id
  const n = last ? parseInt(last.replace('EPID', '')) + 1 : 1
  return `EPID${String(n).padStart(4, '0')}`
}

async function getAuthorisedPerson(user_id: string) {
  const { data } = await supabaseAdmin
    .from('profiles').select('full_name, mobile, whatsapp_number, email')
    .eq('user_id', user_id).ilike('relationship', 'self').maybeSingle()
  return data || null
}

async function generateSlug(displayName: string, cityName: string, pincode: string) {
  const base = [displayName, cityName, pincode].filter(Boolean).join(' ')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  let slug = base, n = 0
  while (true) {
    const { data } = await supabaseAdmin.from('entities').select('id').eq('slug', slug).maybeSingle()
    if (!data) return slug
    n += 1
    slug = `${base}-${String(n).padStart(2, '0')}`
  }
}

async function matchReportingOffice(entityId: string) {
  const { data: regAddr } = await supabaseAdmin
    .from('entity_addresses').select('city, state, country_id')
    .eq('entity_id', entityId).eq('address_type', 'registered').maybeSingle()
  if (!regAddr) return { matched: false, company_id: null as string | null, country_id: null as string | null }

  let branch: any = null
  if (regAddr.city) {
    const { data } = await supabaseAdmin.from('branch_coverage').select('company_id').eq('city_id', regAddr.city).eq('is_active', true).maybeSingle()
    branch = data
  }
  if (!branch && regAddr.state) {
    const { data } = await supabaseAdmin.from('branch_coverage').select('company_id').eq('state_id', regAddr.state).eq('is_active', true).maybeSingle()
    branch = data
  }
  if (!branch && regAddr.country_id) {
    const { data } = await supabaseAdmin.from('branch_coverage').select('company_id')
      .eq('country_id', regAddr.country_id).is('state_id', null).is('city_id', null).eq('is_active', true).maybeSingle()
    branch = data
  }
  if (!branch) return { matched: false, company_id: null as string | null, country_id: null as string | null }

  const { data: addrRow } = await supabaseAdmin.from('company_addresses')
    .select('country_id').eq('company_id', branch.company_id).eq('is_active', true).limit(1).maybeSingle()

  return { matched: true, company_id: branch.company_id as string, country_id: (addrRow?.country_id || null) as string | null }
}

async function getEntityOwnerContact(entityId: string) {
  const { data: entity } = await supabaseAdmin.from('entities').select('user_id, display_name').eq('id', entityId).maybeSingle()
  if (!entity) return null
  const { data: user } = await supabaseAdmin.from('users').select('email').eq('id', entity.user_id).maybeSingle()
  return { email: user?.email || '', name: entity.display_name }
}

// Same lookup used for the Reporting Office contact panel — reused so the
// "received" email points to the right country-specific Customer Care address.
async function getEntitySupportEmail(entityId: string): Promise<string | undefined> {
  const { data: entity } = await supabaseAdmin.from('entities').select('confirmed_country_id').eq('id', entityId).maybeSingle()
  if (!entity?.confirmed_country_id) return undefined
  const { data: contact } = await supabaseAdmin.from('module_country_contacts')
    .select('customer_care_email').eq('module_code', 'EntityRegistration').eq('country_id', entity.confirmed_country_id).eq('status', 'active').maybeSingle()
  return contact?.customer_care_email || undefined
}

const isUuid = (v: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v || '')

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const sp = req.nextUrl.searchParams

  if (sp.get('profile_only') === 'true') {
    return NextResponse.json({ authorised_person: await getAuthorisedPerson(session.user_id) })
  }

  if (sp.get('type') === 'entity_types') {
    const { data, error } = await supabaseAdmin.from('entity_types').select('id, name').eq('status', 'active').order('name')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  if (sp.get('type') === 'kyc_rules') {
    const entityId = sp.get('entity_id')
    if (!entityId) return NextResponse.json({ error: 'Missing entity_id' }, { status: 400 })

    const { data: entity } = await supabaseAdmin.from('entities')
      .select('entity_type_id, reporting_company_id, confirmed_country_id').eq('id', entityId).maybeSingle()
    if (!entity) return NextResponse.json({ error: 'Entity not found' }, { status: 404 })

    if (!entity.reporting_company_id) return NextResponse.json({ data: [], existing: [], not_mapped: true })

    let countryName = ''
    if (entity.confirmed_country_id) {
      const { data: country } = await supabaseAdmin.from('country_master').select('name').eq('id', entity.confirmed_country_id).maybeSingle()
      countryName = country?.name || ''
    }

    const { data: rules, error } = await supabaseAdmin
      .from('kyc_document_rules')
      .select('id, document_type_id, needs_number, needs_front_upload, needs_back_upload, is_conditional, document_types(name, display_order, number_length)')
      .eq('entity_type_id', entity.entity_type_id).eq('country', countryName).eq('status', 'active')
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const sorted = (rules || []).sort((a: any, b: any) =>
      (a.document_types?.display_order ?? 0) - (b.document_types?.display_order ?? 0))

    const { data: existing } = await supabaseAdmin
      .from('entity_documents').select('document_type_id, document_number, has_document, front_url, back_url').eq('entity_id', entityId)

    return NextResponse.json({ data: sorted, existing: existing || [] })
  }

  if (sp.get('type') === 'policies') {
    const entityId = sp.get('entity_id')
    if (!entityId) return NextResponse.json({ error: 'Missing entity_id' }, { status: 400 })
    const { data: entity } = await supabaseAdmin.from('entities').select('confirmed_country_id').eq('id', entityId).maybeSingle()

    const { data: globalRows } = await supabaseAdmin.from('policies')
      .select('id, display_name, policy_type, content')
      .contains('modules', ['EntityRegistration']).eq('scope', 'global').eq('status', 'active')

    let countryRows: any[] = []
    if (entity?.confirmed_country_id) {
      const { data } = await supabaseAdmin.from('policies')
        .select('id, display_name, policy_type, content')
        .contains('modules', ['EntityRegistration']).eq('country_id', entity.confirmed_country_id).eq('status', 'active')
      countryRows = data || []
    }

    // Country-specific wins per policy_type; Global fills in any type missing a country version
    const byType = new Map<string, any>()
    ;(globalRows || []).forEach(p => byType.set(p.policy_type, p))
    countryRows.forEach(p => byType.set(p.policy_type, p))
    const policiesData = Array.from(byType.values())

    let countryCode = ''
    if (entity?.confirmed_country_id) {
      const { data: countryRow } = await supabaseAdmin.from('country_master')
        .select('iso2').eq('id', entity.confirmed_country_id).maybeSingle()
      countryCode = countryRow?.iso2 || ''
    }

    return NextResponse.json({ data: policiesData, country_id: entity?.confirmed_country_id || null, country_code: countryCode })
  }

  if (sp.get('type') === 'reporting_office') {
    const entityId = sp.get('entity_id')
    if (!entityId) return NextResponse.json({ error: 'Missing entity_id' }, { status: 400 })
    const { data: entity } = await supabaseAdmin.from('entities')
      .select('reporting_company_id, confirmed_country_id').eq('id', entityId).maybeSingle()
    if (!entity?.reporting_company_id) return NextResponse.json({ data: { not_mapped: true } })

    const { data: company } = await supabaseAdmin.from('companies').select('id, display_name').eq('id', entity.reporting_company_id).maybeSingle()

    const { data: addrRow } = await supabaseAdmin.from('company_addresses')
      .select('line1, line2, area, city, district, state, pincode, country_id').eq('company_id', entity.reporting_company_id).eq('is_active', true).limit(1).maybeSingle()
    let addressOut = null
    if (addrRow) {
      const { data: c } = await supabaseAdmin.from('country_master').select('name').eq('id', addrRow.country_id).maybeSingle()

      let cityName = addrRow.city
      if (isUuid(addrRow.city)) {
        const { data: cityLoc } = await supabaseAdmin.from('locations').select('name').eq('id', addrRow.city).maybeSingle()
        cityName = cityLoc?.name || addrRow.city
      }
      let stateName = addrRow.state
      if (isUuid(addrRow.state)) {
        const { data: stateLoc } = await supabaseAdmin.from('locations').select('name').eq('id', addrRow.state).maybeSingle()
        stateName = stateLoc?.name || addrRow.state
      }
      let districtName = addrRow.district
      if (isUuid(addrRow.district)) {
        const { data: districtLoc } = await supabaseAdmin.from('locations').select('name').eq('id', addrRow.district).maybeSingle()
        districtName = districtLoc?.name || addrRow.district
      }

      addressOut = { line1: addrRow.line1, line2: addrRow.line2, area: addrRow.area, city: cityName, district: districtName, state: stateName, pincode: addrRow.pincode, country: c?.name || '' }
    }

    const { data: auth } = await supabaseAdmin.from('region_module_auth').select('staff_id')
      .eq('company_id', entity.reporting_company_id).eq('module_code', 'EntityRegistration').eq('status', 'active').maybeSingle()

    let authorisedPerson = null
    if (auth) {
      const { data: staff } = await supabaseAdmin.from('admin_staff').select('name, user_id').eq('id', auth.staff_id).maybeSingle()
      let designation = '', department = ''
      if (staff?.user_id) {
        const { data: profile } = await supabaseAdmin.from('profiles').select('designation_id, department_id')
          .eq('user_id', staff.user_id).ilike('relationship', 'self').maybeSingle()
        if (profile?.designation_id) {
          const { data: d } = await supabaseAdmin.from('designations').select('name').eq('id', profile.designation_id).maybeSingle()
          designation = d?.name || ''
        }
        if (profile?.department_id) {
          const { data: dept } = await supabaseAdmin.from('departments').select('name').eq('id', profile.department_id).maybeSingle()
          department = dept?.name || ''
        }
      }
      authorisedPerson = staff ? { name: staff.name, designation, department } : null
    }

    const { data: contactRow } = await supabaseAdmin.from('module_country_contacts')
      .select('customer_care_email, customer_care_phone, escalation_email, escalation_phone, nodal_email, nodal_phone')
      .eq('module_code', 'EntityRegistration').eq('country_id', entity.confirmed_country_id).eq('status', 'active').maybeSingle()

    return NextResponse.json({
      data: {
        not_mapped: false,
        company_name: company?.display_name || '',
        address: addressOut,
        authorised_person: authorisedPerson,
        contacts: contactRow || null
      }
    })
  }

  const addressFor = sp.get('address_for')
  if (addressFor) {
    const { data, error } = await supabaseAdmin
      .from('entity_addresses').select('address_type, pincode, area, line1, line2, city, district, state, country_id, landmark')
      .eq('entity_id', addressFor)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  const ref = sp.get('process_id')
  if (!ref) return NextResponse.json({ error: 'Missing process_id' }, { status: 400 })
  const { data: entity, error } = await supabaseAdmin.from('entities').select('*').eq('process_id', ref).maybeSingle()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!entity) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const authorised_person = await getAuthorisedPerson(entity.user_id)

  // isOwner: is the logged-in person the one who registered this entity?
  // This decides where "Close" goes — the ONLY thing that matters for that.
  //
  // can_edit: whether the form can be unlocked right now.
  //   - Owner: only while status is still 'draft'. Locked from Pending onward.
  //   - Staff (not owner): is_super_admin is the temporary stand-in until
  //     real per-entity Rights is built.
  const isOwner = session.user_id === entity.user_id
  const can_edit = isOwner ? entity.status === 'draft' : !!session.is_super_admin

  return NextResponse.json({ data: entity, authorised_person, can_edit, is_owner: isOwner })
}

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { action } = body

  if (action === 'save_section2') {
    const { id, entity_type_id, legal_name, display_name, registered, operating } = body
    let entityRow: any

    if (id) {
      const { data, error } = await supabaseAdmin.from('entities')
        .update({ entity_type_id, legal_name, display_name, updated_at: new Date().toISOString() })
        .eq('id', id).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      entityRow = data
    } else {
      const process_id = await nextProcessId()
      const { data, error } = await supabaseAdmin.from('entities').insert({
        process_id, user_id: session.user_id, entity_type_id, legal_name, display_name,
        status: 'draft', created_by: session.user_id
      }).select().single()
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
      entityRow = data
    }

    const saveAddr = async (type: string, addr: any) => {
      const payload = {
        entity_id: entityRow.id, address_type: type,
        pincode: addr.pincode, area: addr.area, line1: addr.line1, line2: addr.line2,
        city: addr.city_id || null, district: addr.district_id || null, state: addr.state_id || null,
        country_id: addr.country_id || null, landmark: addr.landmark
      }
      const { data: existingRow } = await supabaseAdmin.from('entity_addresses')
        .select('id').eq('entity_id', entityRow.id).eq('address_type', type).maybeSingle()
      if (existingRow) {
        await supabaseAdmin.from('entity_addresses').update(payload).eq('id', existingRow.id)
      } else {
        await supabaseAdmin.from('entity_addresses').insert(payload)
      }
    }

    await saveAddr('registered', registered)
    await saveAddr('operating', operating)

    const slug = await generateSlug(display_name, registered.city_name, registered.pincode)

    const match = await matchReportingOffice(entityRow.id)
    const { data: finalRow, error: slugErr } = await supabaseAdmin.from('entities')
      .update({
        slug,
        reporting_company_id: match.matched ? match.company_id : null,
        confirmed_country_id: match.matched ? match.country_id : null
      }).eq('id', entityRow.id).select().single()
    if (slugErr) return NextResponse.json({ error: slugErr.message }, { status: 500 })

    return NextResponse.json({ data: finalRow })  
  }

  if (action === 'save_section3') {
    const { entity_id, answers } = body
    if (!entity_id) return NextResponse.json({ error: 'Missing entity_id' }, { status: 400 })

    for (const a of answers || []) {
      const { error } = await supabaseAdmin.from('entity_documents').upsert({
        entity_id, document_type_id: a.document_type_id,
        document_number: a.document_number || null,
        has_document: a.has_document ?? null,
        created_by: session.user_id, updated_at: new Date().toISOString()
      }, { onConflict: 'entity_id,document_type_id' })
      if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'remove_document_photo') {
    const { entity_id, document_type_id, side } = body
    if (!entity_id || !document_type_id || !side) return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    const fileName = `${entity_id}_${document_type_id}_${side}.webp`
    await supabaseAdmin.storage.from('entity-documents').remove([fileName])
    const urlColumn = side === 'front' ? 'front_url' : 'back_url'
    const { error } = await supabaseAdmin.from('entity_documents')
      .update({ [urlColumn]: null, updated_at: new Date().toISOString() })
      .eq('entity_id', entity_id).eq('document_type_id', document_type_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ success: true })
  }

  if (action === 'accept_policies') {
    const { entity_id, policy_ids } = body
    if (!entity_id || !Array.isArray(policy_ids) || policy_ids.length === 0)
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })

    const ip = req.headers.get('x-forwarded-for') ?? req.headers.get('x-real-ip') ?? 'unknown'
    const rows = policy_ids.map((policy_id: string) => ({ entity_id, policy_id, ip_address: ip }))
    const { error: accError } = await supabaseAdmin.from('entity_policy_acceptance').insert(rows)
    if (accError) return NextResponse.json({ error: accError.message }, { status: 500 })

    const { error: statusError } = await supabaseAdmin.from('entities')
      .update({ status: 'pending', email_verified: true, tc_accepted: true, owner_notice: null, updated_at: new Date().toISOString() }).eq('id', entity_id)
    if (statusError) return NextResponse.json({ error: statusError.message }, { status: 500 })

    // Resubmission after a correction flips the existing open ticket back to Admin's queue.
    // First-ever submission creates a fresh ticket and sends the "received" email.
    const { data: openTicket } = await supabaseAdmin
      .from('tickets').select('id').eq('entity_id', entity_id).eq('category', 'Registration').neq('status', 'Closed').maybeSingle()

    if (openTicket) {
      await supabaseAdmin.from('tickets').update({ status: 'Resubmitted', updated_at: new Date().toISOString() }).eq('id', openTicket.id)
    } else {
      await supabaseAdmin.from('tickets').insert({ category: 'Registration', sub_category: 'New Submission', status: 'New', entity_id, created_by: session.user_id })
      const contact = await getEntityOwnerContact(entity_id)
      if (contact?.email) {
        const supportEmail = await getEntitySupportEmail(entity_id)
        await sendEntityStatusEmail({ to: contact.email, name: contact.name, type: 'received', supportEmail })
      }
    }

    return NextResponse.json({ success: true })
  }

  if (action === 'submit_for_review') {
    const { entity_id } = body
    if (!entity_id) return NextResponse.json({ error: 'Missing entity_id' }, { status: 400 })

    // Already submitted and still open? Don't create a second ticket —
    // just confirm success so the screen can move to view mode.
    const { data: existingOpen } = await supabaseAdmin
      .from('tickets').select('id').eq('entity_id', entity_id).eq('category', 'Registration').neq('status', 'Closed').maybeSingle()
    if (existingOpen) return NextResponse.json({ success: true, already_submitted: true })

    const { error } = await supabaseAdmin.from('entities')
      .update({ status: 'pending', owner_notice: null, updated_at: new Date().toISOString() }).eq('id', entity_id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    await supabaseAdmin.from('tickets').insert({ category: 'Registration', sub_category: 'Unmapped Reporting Office', status: 'New', entity_id, created_by: session.user_id })
    const contact = await getEntityOwnerContact(entity_id)
    if (contact?.email) {
      const supportEmail = await getEntitySupportEmail(entity_id)
      await sendEntityStatusEmail({ to: contact.email, name: contact.name, type: 'received', supportEmail })
    }

    return NextResponse.json({ success: true })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}
