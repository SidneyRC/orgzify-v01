import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCompanyRights } from '@/lib/getCompanyRights'

// Walks down from rootId through parent_company_id chain.
// Returns rootId + every company nested under it, at any depth.
export async function getDownlineIds(rootId: string): Promise<string[]> {
  const result = new Set<string>([rootId])
  let currentLevel = [rootId]

  while (currentLevel.length > 0) {
    const { data: children } = await supabaseAdmin
      .from('companies')
      .select('id')
      .in('parent_company_id', currentLevel)

    const newIds = (children || [])
      .map((c: any) => c.id)
      .filter((id: string) => !result.has(id))

    if (newIds.length === 0) break
    newIds.forEach((id: string) => result.add(id))
    currentLevel = newIds
  }

  return Array.from(result)
}

type Session = { user_id: string; is_super_admin?: boolean }

// context.processId + context.module = "viewing this page from inside a specific company"
// Process ID is permanent/never editable — safe to resolve to the real company here.
// Verifies real access (role + module right) before scoping to that company + downline.
// No context = normal Admin Panel behavior (Super Admin flag check).
export async function getScopedCompanyIds(
  session: Session,
  context?: { processId?: string; module?: string }
): Promise<string[] | null> {

  if (context?.processId) {
    const { data: company } = await supabaseAdmin
      .from('companies').select('id').eq('process_id', context.processId).maybeSingle()
    if (!company?.id) return []

    const { data: roleRow } = await supabaseAdmin
      .from('user_roles').select('id')
      .eq('user_id', session.user_id).eq('company_id', company.id).eq('is_active', true).maybeSingle()
    if (!roleRow) return []

    if (context.module) {
      const rights = await getCompanyRights(session.user_id, company.id)
      if (!rights.includes(context.module)) return []
    }

    return getDownlineIds(company.id)
  }

  // No company context — old Super Admin / Admin Panel behavior
  if (session.is_super_admin) return null

  const { data: roleRow } = await supabaseAdmin
    .from('user_roles').select('company_id')
    .eq('user_id', session.user_id).eq('is_active', true).maybeSingle()

  if (!roleRow?.company_id) return []
  return getDownlineIds(roleRow.company_id)
}

// Shared rule for all Setup pages: you can always VIEW your own company's
// record, but you can never EDIT it — even if your role has edit rights.
// Edit rights only apply to downline companies, never your own.
export function isOwnRecord(activeCompanyId: string | null, targetId: string): boolean {
  if (!activeCompanyId) return false
  return activeCompanyId === targetId
}