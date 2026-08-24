// FILE PATH: lib/getResolvedThemeByCity.ts
// Resolves the customer-facing theme based on a customer's saved city.
// Rollup order: city -> state -> country -> global default.
// Reuses getResolvedTheme() once a company is found, so there is only
// one place that walks a company's reporting_company_id chain.

import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getResolvedTheme } from '@/lib/getResolvedTheme'
import type { Theme } from '@/lib/ThemeContext'

const GLOBAL_DEFAULT_THEME_ID = '5ad85f55-6fab-4db2-a8e3-b1507a39de86'

async function findCompanyId(field: 'city_id' | 'state_id' | 'country_id', id: string): Promise<string | null> {
  const { data } = await supabaseAdmin
    .from('branch_coverage')
    .select('company_id')
    .eq(field, id)
    .eq('is_active', true)
    .limit(1)
    .maybeSingle()
  return data?.company_id ?? null
}

export async function getResolvedThemeByCity(cityId: string | null): Promise<Theme | null> {
  if (!cityId) return getResolvedTheme(GLOBAL_DEFAULT_THEME_ID)

  // Step 1: try exact city match
  const cityCompanyId = await findCompanyId('city_id', cityId)
  if (cityCompanyId) return getResolvedTheme(cityCompanyId)

  // Look up the city's own record to walk up to state/country
  const { data: city } = await supabaseAdmin
    .from('locations')
    .select('id, parent_id, country_id')
    .eq('id', cityId)
    .maybeSingle()

  // Step 2: try state match (city's parent_id is assumed to be its state)
  if (city?.parent_id) {
    const stateCompanyId = await findCompanyId('state_id', city.parent_id)
    if (stateCompanyId) return getResolvedTheme(stateCompanyId)
  }

  // Step 3: try country match
  if (city?.country_id) {
    const countryCompanyId = await findCompanyId('country_id', city.country_id)
    if (countryCompanyId) return getResolvedTheme(countryCompanyId)
  }

  // Step 4: nothing matched, use global default
  return getResolvedTheme(GLOBAL_DEFAULT_THEME_ID)
}
