import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { jwtVerify } from 'jose'
import OREV1_045_LocationsPage from '@/components/admin/OREV1-045-LocationsPage'

export const metadata = {
  title: 'Locations — Orgzify Admin',
  description: 'Manage states, districts and cities across all countries',
}

export default async function LocationsPage() {
  const cookieStore = await cookies()
  const token = cookieStore.get('orgzify_token')?.value
  if (!token) redirect('/login')

  const secret = new TextEncoder().encode(process.env.JWT_SECRET!)
  const { payload } = await jwtVerify(token, secret).catch(() => ({ payload: null }))
  if (!payload || !payload.is_super_admin) redirect('/profiles')

  return <OREV1_045_LocationsPage />
}