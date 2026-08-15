// GOES IN: lib/helpDeskTickets.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { HelpDeskAccess } from '@/lib/helpDeskAccess'
import { enrichTicketRows } from '@/lib/helpDeskEnrich'
import { matchingReferenceIds } from '@/lib/helpDeskUnifiedSearch'

type Filters = {
  page: number; limit: number; search?: string; reference_type?: string
  category_id?: string; sub_category_id?: string; status_code?: string
  country_id?: string; reporting_office_search?: string
}

async function companyIdsForCountry(countryId: string): Promise<string[]> {
  const { data } = await supabaseAdmin.from('company_addresses')
    .select('company_id').eq('address_type', 'registered').eq('country_id', countryId)
  return (data || []).map((a: any) => a.company_id)
}

async function companyIdsForSearch(search: string): Promise<string[]> {
  const { data } = await supabaseAdmin.from('companies').select('id').ilike('display_name', `%${search}%`)
  return (data || []).map((c: any) => c.id)
}

export async function listHelpDeskTickets(access: HelpDeskAccess, filters: Filters) {
  if (access.type === 'none') return { data: [], total: 0 }

  let query = supabaseAdmin.from('help_desk_tickets')
    .select('id, ticket_number, reference_type, reference_id, category_id, sub_category_id, status_code, next_followup_date, created_at, reporting_company_id', { count: 'exact' })

  if (filters.search) {
    const { entityIds, staffIds, customerIds } = await matchingReferenceIds(filters.search)
    const orParts = [`ticket_number.ilike.%${filters.search}%`]
    if (entityIds.length) orParts.push(`and(reference_type.eq.entity,reference_id.in.(${entityIds.join(',')}))`)
    if (staffIds.length) orParts.push(`and(reference_type.eq.staff,reference_id.in.(${staffIds.join(',')}))`)
    if (customerIds.length) orParts.push(`and(reference_type.eq.customer,reference_id.in.(${customerIds.join(',')}))`)
    query = query.or(orParts.join(','))
  }
  if (filters.reference_type) query = query.eq('reference_type', filters.reference_type)
  if (filters.category_id) query = query.eq('category_id', filters.category_id)
  if (filters.sub_category_id) query = query.eq('sub_category_id', filters.sub_category_id)
  if (filters.status_code) query = query.eq('status_code', filters.status_code)

  if (filters.country_id) {
    const ids = await companyIdsForCountry(filters.country_id)
    query = query.in('reporting_company_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  }
  if (filters.reporting_office_search) {
    const ids = await companyIdsForSearch(filters.reporting_office_search)
    query = query.in('reporting_company_id', ids.length ? ids : ['00000000-0000-0000-0000-000000000000'])
  }

  if (access.type === 'scoped' && access.companyIds) {
    query = query.in('reporting_company_id', access.companyIds)
  }

  const from = (filters.page - 1) * filters.limit
  const { data: rows, count, error } = await query.order('created_at', { ascending: false }).range(from, from + filters.limit - 1)
  if (error) return { data: [], total: 0, error: error.message }

  const enriched = await enrichTicketRows(rows || [])
  return { data: enriched, total: count ?? 0 }
}
