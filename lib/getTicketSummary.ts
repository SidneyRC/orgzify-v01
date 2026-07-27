import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getScopedCompanyIds } from '@/lib/companyScope'

// Shared by the Support API (type=summary) and the Ecosystem page card —
// one place, queries the table directly, no HTTP round-trip needed.
export async function getTicketSummary(session: any): Promise<{ total: number; resolved: number; open: number }> {
  if (!session) return { total: 0, resolved: 0, open: 0 }

  const scopedIds = await getScopedCompanyIds(session)
  let entityQuery = supabaseAdmin.from('entities').select('id')
  if (scopedIds) entityQuery = entityQuery.in('reporting_company_id', scopedIds)
  const { data: entityRows } = await entityQuery
  const entityIds = (entityRows || []).map((e: any) => e.id)
  if (entityIds.length === 0) return { total: 0, resolved: 0, open: 0 }

  const { count: total } = await supabaseAdmin.from('tickets').select('id', { count: 'exact', head: true }).in('entity_id', entityIds)
  const { count: resolved } = await supabaseAdmin.from('tickets').select('id', { count: 'exact', head: true }).in('entity_id', entityIds).eq('status', 'Closed')
  return { total: total || 0, resolved: resolved || 0, open: (total || 0) - (resolved || 0) }
}