// GOES IN: lib/helpDeskUnifiedSearch.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { baseSearchUsers } from '@/lib/helpDeskSearchBase'

export async function matchingReferenceIds(q: string) {
  const base = await baseSearchUsers(q)
  const ownerUserIds = base.map(b => b.user_id)

  // Entities: direct fields + owned by a matched person
  const { data: entityDirect } = await supabaseAdmin.from('entities').select('id')
    .or(`process_id.ilike.%${q}%,display_name.ilike.%${q}%,legal_name.ilike.%${q}%,entity_unique_id.ilike.%${q}%`)
  let entityByOwner: any[] = []
  if (ownerUserIds.length) {
    const { data } = await supabaseAdmin.from('entities').select('id').in('user_id', ownerUserIds)
    entityByOwner = data || []
  }
  const entityIds = [...new Set([...(entityDirect || []), ...entityByOwner].map((e: any) => e.id))]

  // Staff: direct fields + matched via user's ZY ID + matched via company name
  const { data: zyMatches } = await supabaseAdmin.from('users').select('id').ilike('zy_id', `%${q}%`)
  const zyUserIds = (zyMatches || []).map((u: any) => u.id)
  const { data: companyMatches } = await supabaseAdmin.from('companies').select('id').ilike('display_name', `%${q}%`)
  const companyIds = (companyMatches || []).map((c: any) => c.id)

  const { data: staffDirect } = await supabaseAdmin.from('admin_staff').select('id')
    .or(`name.ilike.%${q}%,email.ilike.%${q}%,mobile.ilike.%${q}%,staff_enrollment_number.ilike.%${q}%`)
  let staffByZy: any[] = []
  if (zyUserIds.length) {
    const { data } = await supabaseAdmin.from('admin_staff').select('id').in('user_id', zyUserIds)
    staffByZy = data || []
  }
  let staffByCompany: any[] = []
  if (companyIds.length) {
    const { data } = await supabaseAdmin.from('admin_staff').select('id')
      .or(`recruiting_office_id.in.(${companyIds.join(',')}),reporting_office_id.in.(${companyIds.join(',')})`)
    staffByCompany = data || []
  }
  const staffIds = [...new Set([...(staffDirect || []), ...staffByZy, ...staffByCompany].map((s: any) => s.id))]

  // Customers: a ticket may store either the profile's own id (normal case) or the user's id
  // (raised before the profile was completed) — match both so search always finds it either way.
  const profileIds = base.map(b => b.profile_id).filter(Boolean) as string[]
  const customerIds = [...new Set([...ownerUserIds, ...profileIds])]

  return { entityIds, staffIds, customerIds }
}
