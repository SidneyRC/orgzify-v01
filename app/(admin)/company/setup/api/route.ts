import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getActiveCompanyId } from '@/lib/activeCompanyContext'
import { getCompanyRights } from '@/lib/getCompanyRights'

async function getDownlineIds(rootId: string) {
  const ids = [rootId]
  let frontier = [rootId]
  while (frontier.length) {
    const { data } = await supabaseAdmin.from('companies').select('id').in('parent_company_id', frontier)
    const next = (data || []).map(r => r.id).filter(id => !ids.includes(id))
    if (!next.length) break
    ids.push(...next)
    frontier = next
  }
  return ids
}

export async function GET(req: NextRequest) {
  const session = await import('@/lib/auth').then(m => m.getSession(req))
  if (!session) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })

  const cookieStore = await cookies()
  const companyId = await getActiveCompanyId(cookieStore)
  if (!companyId) return NextResponse.json({ error: 'Company not found.' }, { status: 404 })

  const rights = await getCompanyRights(session.user_id, companyId)
  const ids = await getDownlineIds(companyId)
  const cards: Record<string, any> = {}

  if (rights.includes('companies')) {
    const { count } = await supabaseAdmin.from('companies').select('*', { count: 'exact', head: true }).eq('company_status', 'active').in('id', ids)
    cards.companies = { count: count ?? 0 }
  }

  if (rights.includes('geofence')) {
    const { data: covered } = await supabaseAdmin.from('branch_coverage').select('company_id, country_id, state_id').in('company_id', ids)
    const companies = new Set((covered || []).map((r: any) => r.company_id)).size
    const countries = new Set((covered || []).filter((r: any) => !r.state_id).map((r: any) => r.country_id)).size
    const states = new Set((covered || []).filter((r: any) => !!r.state_id).map((r: any) => r.state_id)).size
    cards.geofence = { companies, countries, states }
  }

  if (rights.includes('assign_roles')) {
    const { data } = await supabaseAdmin.from('user_roles').select('company_id').eq('is_active', true).in('company_id', ids)
    const companies = new Set((data || []).map((r: any) => r.company_id)).size
    cards.assign_roles = { companies, assigned: (data || []).length }
  }

  return NextResponse.json({ rights, cards })
}