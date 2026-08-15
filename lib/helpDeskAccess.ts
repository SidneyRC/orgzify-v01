// GOES IN: lib/helpDeskAccess.ts
import { getDownlineIds } from '@/lib/companyScope'
import { getFullCompanyRights } from '@/lib/getCompanyRights'

export type HelpDeskAccess =
  | { type: 'all' }
  | { type: 'scoped'; companyIds: string[] | null }
  | { type: 'none' }

export async function getHelpDeskAccess(session: any, activeCompanyId: string | null): Promise<HelpDeskAccess> {
  // No active company context = main Admin Panel — old Super Admin behavior applies.
  if (!activeCompanyId) {
    return session.is_super_admin ? { type: 'all' } : { type: 'none' }
  }

  // Inside a specific company's view — always scope to that company's real role
  // rights, same as Entities/every other page. Company view means "see exactly
  // what this role sees," even for a Super Admin browsing that company.
  const rights = await getFullCompanyRights(session.user_id, activeCompanyId)
  if (!rights['help_desk']?.can_view) return { type: 'none' }

  const companyIds = await getDownlineIds(activeCompanyId)
  return { type: 'scoped', companyIds }
}

// Kept for compatibility with existing call sites — Category+Status pair
// checks are parked (see Master Doc). Access is now company-scoped only.
export function isPairAllowed(access: HelpDeskAccess, _subCategoryId?: string, _statusCode?: string): boolean {
  return access.type !== 'none'
}
