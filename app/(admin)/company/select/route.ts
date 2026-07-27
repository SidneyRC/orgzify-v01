import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getSession } from '@/lib/auth'

export async function POST(req: NextRequest) {
  const session = await getSession(req)
  if (!session) return NextResponse.json({ error: 'Unauthorised' }, { status: 401 })

  const { company_id } = await req.json()
  if (!company_id) return NextResponse.json({ error: 'company_id required' }, { status: 400 })

  const { data: company } = await supabaseAdmin
    .from('companies').select('process_id').eq('id', company_id).maybeSingle()

  if (!company?.process_id) return NextResponse.json({ error: 'Company not found' }, { status: 404 })

  const response = NextResponse.json({ success: true })
  response.cookies.set('orgzify_context', `company:${company.process_id}`, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: '/',
  })
  return response
}