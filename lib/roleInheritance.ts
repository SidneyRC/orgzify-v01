// THIS FILE GOES IN: lib/roleInheritance.ts (NEW FILE)
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const DEFAULT_ADMIN_ROLE_ID = 'f8b0dce1-1d12-4c1b-b52c-10d4ed473f62'

// Walks UP the parent_company_id chain starting from parentCompanyId.
// Uses the nearest ancestor's own active role, if any exist there.
// Falls back to the shared Default Admin role if nothing found anywhere up the chain.
export async function resolveInheritedRoleId(parentCompanyId: string | null): Promise<string> {
  let currentId = parentCompanyId

  while (currentId) {
    const { data: roleRow } = await supabaseAdmin
      .from('user_roles')
      .select('role_id')
      .eq('company_id', currentId)
      .eq('is_active', true)
      .neq('role_id', DEFAULT_ADMIN_ROLE_ID)
      .maybeSingle()

    if (roleRow?.role_id) return roleRow.role_id

    const { data: company } = await supabaseAdmin
      .from('companies').select('parent_company_id').eq('id', currentId).maybeSingle()
    currentId = company?.parent_company_id || null
  }

  return DEFAULT_ADMIN_ROLE_ID
}
