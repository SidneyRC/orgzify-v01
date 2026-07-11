// THIS FILE GOES IN: app/(admin)/admin/setup/geofence/assign/page.tsx
// Checks the active company cookie + real rights before allowing access.
// Same pattern as the Geofence list page.

import { Suspense } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { jwtVerify } from 'jose'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { getCompanyRights } from '@/lib/getCompanyRights'
import { isOwnRecord } from '@/lib/companyScope'
import OREV1048AGeofenceAssign from '@/components/admin/OREV1-048A-GeofenceAssign'

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!)

export const metadata = { title: 'Assign Territory — Orgzify Admin' }

export default async function GeofenceAssignPage({ searchParams }: { searchParams: Promise<{ company_id?: string }> }) {
  const { company_id } = await searchParams
  const cookieStore = await cookies()

  const token = cookieStore.get('orgzify_token')?.value
  if (!token) redirect('/login')
  let session: { user_id: string; is_super_admin?: boolean }
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    session = payload as any
  } catch {
    redirect('/login')
  }

  const rawContext = decodeURIComponent(cookieStore.get('orgzify_context')?.value || '')
  const [ctxType, ctxId] = rawContext.split(':')

  // No company context — old Super Admin / Admin Panel behavior, unchanged
  if (ctxType === 'company' && ctxId) {
    const { data: company } = await supabaseAdmin
      .from('companies').select('id').eq('process_id', ctxId).maybeSingle()
    if (!company?.id) redirect('/access-denied')

    const rights = await getCompanyRights(session.user_id, company.id)
    if (!rights.includes('geofence')) redirect('/access-denied')

    // Block editing your own company's territory, even via direct URL
    if (company_id && isOwnRecord(company.id, company_id)) redirect('/access-denied')
  }

  return (
    <Suspense fallback={<div className="p-6 text-sm text-gray-400">Loading…</div>}>
      <OREV1048AGeofenceAssign />
    </Suspense>
  )
}
