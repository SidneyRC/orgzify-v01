import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
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

export async function GET(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 })

  const { data: company } = await supabaseAdmin.from('companies').select('id').eq('slug', slug).maybeSingle()
  if (!company) return NextResponse.json({ error: 'Company not found.' }, { status: 404 })

  const rights = await getCompanyRights(session.user_id, company.id)
  const ids = await getDownlineIds(company.id)
  const cards: Record<string, any> = {}

  // Add new modules here later — nothing else needs to change.
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