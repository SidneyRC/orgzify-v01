// THIS FILE GOES IN: lib/entityTheme.ts (NEW FILE)
import { supabaseAdmin } from '@/lib/supabaseAdmin'

// Hardcoded safety-net default — same constant used across the platform.
// Only used if NO company in the chain (up to Root) has an entity_theme_id set.
const DEFAULT_THEME_ID = '5ad85f55-6fab-4db2-a8e3-b1507a39de86'

// Walks UP the parent_company_id chain starting from reportingCompanyId.
// Uses the nearest ancestor's own active entity_theme_id, if one exists.
// Falls back to the hardcoded platform default if nothing found anywhere up the chain.
export async function resolveEntityThemeId(reportingCompanyId: string | null): Promise<string> {
  let currentId = reportingCompanyId

  while (currentId) {
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('entity_theme_id, parent_company_id')
      .eq('id', currentId)
      .maybeSingle()

    if (company?.entity_theme_id) {
      const { data: theme } = await supabaseAdmin
        .from('company_themes')
        .select('id')
        .eq('id', company.entity_theme_id)
        .eq('is_active', true)
        .maybeSingle()
      if (theme?.id) return theme.id
    }

    currentId = company?.parent_company_id || null
  }

  return DEFAULT_THEME_ID
}
