// GOES IN: lib/helpDeskEnrich.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function enrichTicketRows(rows: any[]) {
  if (rows.length === 0) return rows

  const entityIds = rows.filter(r => r.reference_type === 'entity').map(r => r.reference_id).filter(Boolean)
  const staffIds = rows.filter(r => r.reference_type === 'staff').map(r => r.reference_id).filter(Boolean)
  const customerIds = rows.filter(r => r.reference_type === 'customer').map(r => r.reference_id).filter(Boolean)
  const categoryIds = [...new Set([...rows.map(r => r.category_id), ...rows.map(r => r.sub_category_id)])]
  const companyIds = [...new Set(rows.map(r => r.reporting_company_id).filter(Boolean))]

  const [entities, staff, customers, categories, companies, addresses] = await Promise.all([
    entityIds.length ? supabaseAdmin.from('entities').select('id, display_name').in('id', entityIds) : { data: [] },
    staffIds.length ? supabaseAdmin.from('admin_staff').select('id, name').in('id', staffIds) : { data: [] },
    customerIds.length ? supabaseAdmin.from('profiles').select('id, user_id, full_name')
      .or(`id.in.(${customerIds.join(',')}),user_id.in.(${customerIds.join(',')})`) : { data: [] },
    categoryIds.length ? supabaseAdmin.from('categories').select('id, name').in('id', categoryIds) : { data: [] },
    companyIds.length ? supabaseAdmin.from('companies').select('id, display_name').in('id', companyIds) : { data: [] },
    companyIds.length ? supabaseAdmin.from('company_addresses').select('company_id, country_id').eq('address_type', 'registered').in('company_id', companyIds) : { data: [] },
  ])

  const entityMap = Object.fromEntries((entities.data || []).map((e: any) => [e.id, e.display_name]))
  const staffMap = Object.fromEntries((staff.data || []).map((s: any) => [s.id, s.name]))
  const categoryMap = Object.fromEntries((categories.data || []).map((c: any) => [c.id, c.name]))
  const companyMap = Object.fromEntries((companies.data || []).map((c: any) => [c.id, c.display_name]))
  const addressMap = Object.fromEntries((addresses.data || []).map((a: any) => [a.company_id, a.country_id]))

  // Customer name: reference_id may be a profiles.id (normal) OR a users.id (ticket raised before
  // the profile was completed). Map both so either case resolves to the live current name.
  const customerMap: Record<string, string> = {}
  for (const c of (customers.data || []) as any[]) {
    customerMap[c.id] = c.full_name
    if (c.user_id) customerMap[c.user_id] = c.full_name
  }

  const countryIds = [...new Set(Object.values(addressMap))].filter(Boolean) as string[]
  const { data: countryRows } = countryIds.length ? await supabaseAdmin.from('country_master').select('id, name').in('id', countryIds) : { data: [] }
  const countryMap = Object.fromEntries((countryRows || []).map((c: any) => [c.id, c.name]))

  return rows.map(r => {
    let displayName = ''
    if (r.reference_type === 'entity') displayName = entityMap[r.reference_id] || ''
    else if (r.reference_type === 'staff') displayName = staffMap[r.reference_id] || ''
    else if (r.reference_type === 'customer') displayName = customerMap[r.reference_id] || ''

    return {
      ...r,
      entity_company_name: displayName,
      category_name: categoryMap[r.category_id] || '—',
      sub_category_name: categoryMap[r.sub_category_id] || '—',
      reporting_office_name: r.reporting_company_id ? companyMap[r.reporting_company_id] || '—' : '—',
      country_name: r.reporting_company_id ? countryMap[addressMap[r.reporting_company_id]] || '—' : '—',
    }
  })
}
