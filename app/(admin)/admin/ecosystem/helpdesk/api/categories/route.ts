// GOES IN: app/(admin)/admin/ecosystem/helpdesk/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const referenceType = new URL(req.url).searchParams.get('reference_type') || ''

  const { data: level1 } = await supabaseAdmin.from('categories')
    .select('id, name').eq('level', 1).eq('status', 'active').order('display_order')

  const { data: level2All } = await supabaseAdmin.from('categories')
    .select('id, name, parent_id, audience').eq('level', 2).eq('status', 'active').order('display_order')

  const audienceMap: Record<string, string[]> = {
    entity: ['all', 'entity'], entity_staff: ['all', 'entity_staff'],
    staff: ['all', 'staff'], customer: ['all', 'customers'],
  }
  // No reference_type given (e.g. used for filtering, not ticket creation) — show everything active
  const allowed = referenceType ? (audienceMap[referenceType] || ['all']) : null
  const level2 = allowed ? (level2All || []).filter((s: any) => allowed.includes(s.audience)) : (level2All || [])

  return NextResponse.json({ categories: level1 || [], subCategories: level2 })
}
