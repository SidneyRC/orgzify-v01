import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

const GLOBAL_DEFAULT_THEME_ID = '5ad85f55-6fab-4db2-a8e3-b1507a39de86'

async function fetchTheme(themeId: string) {
  const { data } = await supabaseAdmin.from('company_themes').select('*').eq('id', themeId).maybeSingle()
  return data ?? null
}

async function resolveThemeFromCompany(startId: string) {
  let currentId: string | null = startId
  const visited = new Set<string>()
  while (currentId && !visited.has(currentId)) {
    visited.add(currentId)
    const { data: company } = await supabaseAdmin
      .from('companies')
      .select('id, reporting_company_id, theme_id')
      .eq('id', currentId)
      .maybeSingle()
    if (!company) break
    if (company.theme_id) return fetchTheme(company.theme_id)
    currentId = company.reporting_company_id
  }
  return fetchTheme(GLOBAL_DEFAULT_THEME_ID)
}

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ theme: await fetchTheme(GLOBAL_DEFAULT_THEME_ID) })

  const companyIdParam = req.nextUrl.searchParams.get('company_id')

  if (companyIdParam) {
    const theme = await resolveThemeFromCompany(companyIdParam)
    return NextResponse.json({ theme })
  }

  const { data: roleRow } = await supabaseAdmin
    .from('user_roles')
    .select('company_id')
    .eq('user_id', session.user_id)
    .eq('is_active', true)
    .maybeSingle()

  if (!roleRow?.company_id) {
    return NextResponse.json({ theme: await fetchTheme(GLOBAL_DEFAULT_THEME_ID) })
  }

  const theme = await resolveThemeFromCompany(roleRow.company_id)
  return NextResponse.json({ theme })
}

export async function PATCH(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })
  const body = await req.json()
  const { id, ...fields } = body
  fields.updated_at = new Date().toISOString()
  const { data, error } = await supabaseAdmin.from('companies').update(fields).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (fields.company_status === 'active') {
    // TODO: fetch SPOC from user_roles, call sendEmail()
  }
  return NextResponse.json({ data })
}