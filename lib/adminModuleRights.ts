// THIS FILE GOES IN: lib/adminModuleRights.ts (NEW FILE)
import { NextRequest } from 'next/server'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'

// Generic version of the per-module hasEntityRight() pattern — usable by any
// admin module (Sponsors, Artists, etc.) without duplicating the same logic.
export async function hasModuleRight(req: NextRequest, session: any, moduleCode: string, right: string) {
  if (session.is_super_admin) return true
  const activeCompanyId = await getActiveCompanyId(req.cookies)
  if (!activeCompanyId) return false
  const rights = await getFullCompanyRights(session.user_id, activeCompanyId)
  return !!(rights as any)[moduleCode]?.[right]
}
