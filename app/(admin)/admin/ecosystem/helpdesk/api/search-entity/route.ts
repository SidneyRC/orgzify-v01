// GOES IN: app/(admin)/admin/ecosystem/helpdesk/api/search-entity/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'
import { baseSearchUsers } from '@/lib/helpDeskSearchBase'

const ENTITY_FIELDS = 'id, process_id, display_name, legal_name, user_id, status, entity_unique_id'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const q = new URL(req.url).searchParams.get('q')?.trim() || ''
  if (q.length < 2) return NextResponse.json({ data: [] })

  const base = await baseSearchUsers(q)
  const ownerIds = base.map(b => b.user_id)
  let byOwner: any[] = []
  if (ownerIds.length) {
    const { data } = await supabaseAdmin.from('entities').select(ENTITY_FIELDS).in('user_id', ownerIds)
    byOwner = data || []
  }

  const { data: direct } = await supabaseAdmin.from('entities').select(ENTITY_FIELDS)
    .or(`process_id.ilike.%${q}%,display_name.ilike.%${q}%,legal_name.ilike.%${q}%,entity_unique_id.ilike.%${q}%`).limit(10)

  const all = [...byOwner, ...(direct || [])]
  const unique = Array.from(new Map(all.map(e => [e.id, e])).values())

  const ownerUserIds = [...new Set(unique.map((e: any) => e.user_id))]
  const { data: owners } = ownerUserIds.length ? await supabaseAdmin.from('users').select('id, email').in('id', ownerUserIds) : { data: [] }
  const ownerEmailMap = Object.fromEntries((owners || []).map((u: any) => [u.id, u.email]))

  const results = unique.map((e: any) => ({ ...e, owner_email: ownerEmailMap[e.user_id] || '' }))
  return NextResponse.json({ data: results })
}