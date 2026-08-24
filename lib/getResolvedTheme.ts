import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { Theme } from '@/lib/ThemeContext'

// Global default theme — used when no company in the chain has a
// customer_theme_id set.
const GLOBAL_DEFAULT_THEME_ID = '5ad85f55-6fab-4db2-a8e3-b1507a39de86'

// Walks UP from a company via reporting_company_id, looking for the
// nearest customer_theme_id set anywhere in the chain.
// Falls back to the global default theme if none is found.
export async function getResolvedTheme(companyId: string): Promise<Theme | null> {
  let currentId: string | null = companyId
  const visited = new Set<string>()

  while (currentId && !visited.has(currentId)) {
    visited.add(currentId)

    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, reporting_company_id, customer_theme_id')
      .eq('id', currentId)
      .maybeSingle()

    if (!company) break

    if (company.customer_theme_id) {
      return fetchTheme(company.customer_theme_id)
    }

    currentId = company.reporting_company_id
  }

  return fetchTheme(GLOBAL_DEFAULT_THEME_ID)
}

async function fetchTheme(themeId: string): Promise<Theme | null> {
  const { data: theme } = await supabaseAdmin
    .from('company_themes')
    .select('*')
    .eq('id', themeId)
    .maybeSingle()

  return (theme as Theme) ?? null
}