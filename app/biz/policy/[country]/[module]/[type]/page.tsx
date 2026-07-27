import { supabaseAdmin } from '@/lib/supabaseAdmin'
import type { Metadata } from 'next'
import OREV1070PolicyActions from '@/components/shared/OREV1-070-PolicyActions'
import OREV1071PolicyAdColumn from '@/components/shared/OREV1-071-PolicyAdColumn'
import OREV1072PolicyAdBanner from '@/components/shared/OREV1-072-PolicyAdBanner'

export const metadata: Metadata = { robots: { index: false, follow: false } }

const MODULE_CODE_MAP: Record<string, string> = { 'entity-registration': 'EntityRegistration' }

async function getTheme(ref?: string) {
  let theme = null
  if (ref) {
    const { data: entity } = await supabaseAdmin.from('entities')
      .select('reporting_company_id').eq('process_id', ref).maybeSingle()
    if (entity?.reporting_company_id) {
      const { data: company } = await supabaseAdmin.from('companies')
        .select('entity_theme_id').eq('id', entity.reporting_company_id).maybeSingle()
      if (company?.entity_theme_id) {
        const { data } = await supabaseAdmin.from('company_themes')
          .select('*').eq('id', company.entity_theme_id).eq('is_active', true).maybeSingle()
        theme = data
      }
    }
  }
  if (!theme) {
    const { data } = await supabaseAdmin.from('company_themes').select('*').eq('is_default', true).maybeSingle()
    theme = data
  }
  return theme
}

export default async function PolicyViewPage({ params, searchParams }: {
  params: Promise<{ country: string; module: string; type: string }>
  searchParams: Promise<{ ref?: string }>
}) {
  const { country: countryParam, module: moduleParam, type: rawTypeParam } = await params
  const { ref } = await searchParams
  const typeParam = decodeURIComponent(rawTypeParam)
  const moduleCode = MODULE_CODE_MAP[moduleParam] || moduleParam

  const { data: country } = await supabaseAdmin
    .from('country_master').select('id, ads_enabled').eq('iso2', countryParam.toUpperCase()).maybeSingle()

  let policy = null
  if (country?.id) {
    const { data } = await supabaseAdmin.from('policies')
      .select('display_name, content')
      .contains('modules', [moduleCode]).eq('country_id', country.id).eq('policy_type', typeParam).eq('status', 'active').maybeSingle()
    policy = data
  }
  if (!policy) {
    const { data } = await supabaseAdmin.from('policies')
      .select('display_name, content')
      .contains('modules', [moduleCode]).eq('scope', 'global').eq('policy_type', typeParam).eq('status', 'active').maybeSingle()
    policy = data
  }

  const theme = await getTheme(ref)
  const adsEnabled = !!country?.ads_enabled
  const pageBg = theme?.page_bg || '#f9fafb'
  const textPrimary = theme?.color_text_primary || '#111827'
  const textMuted = theme?.color_text_muted || '#6b7280'
  const borderColor = theme?.color_border || '#e5e7eb'

  return (
    <div style={{ backgroundColor: pageBg, minHeight: '100vh' }} className="flex flex-col">
      <div className={`flex-1 flex flex-col lg:flex-row gap-6 px-6 py-10 max-w-6xl mx-auto w-full items-stretch ${adsEnabled ? 'pb-20' : ''}`}>
        <div className={adsEnabled ? 'lg:w-3/4' : 'w-full'}>
          <div className="bg-white rounded-2xl border flex flex-col" style={{ borderColor, maxHeight: '75vh' }}>
            <div className="overflow-y-auto p-6 flex-1">
              <h1 className="text-xl font-semibold mb-4" style={{ color: textPrimary }}>
                {policy ? policy.display_name : 'Not Available'}
              </h1>
              {policy ? (
                <div className="text-sm leading-relaxed prose prose-sm max-w-none" style={{ color: textMuted }} dangerouslySetInnerHTML={{ __html: policy.content }} />
              ) : (
                <p className="text-sm" style={{ color: textMuted }}>This policy is not available yet. Please contact support.</p>
              )}
            </div>
            <OREV1070PolicyActions theme={theme} refId={ref} />
          </div>
        </div>
        {adsEnabled && <OREV1071PolicyAdColumn borderColor={borderColor} textMuted={textMuted} slotCount={policy && policy.content && policy.content.length > 2000 ? 5 : 3} />}
      </div>
      {adsEnabled && <OREV1072PolicyAdBanner borderColor={borderColor} textMuted={textMuted} />}
    </div>
  )
}