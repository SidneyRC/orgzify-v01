// THIS FILE GOES IN: app/admin/sponsors/page.tsx (NEW FILE)
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import OREV1115SponsorsAdminPage from '@/components/admin/OREV1-115-SponsorsAdminPage'

export default async function SponsorsListPage() {
  const cookieStore = await cookies()
  const { session } = await getActiveCompanyContext(cookieStore)
  if (!session) redirect('/login')

  return <OREV1115SponsorsAdminPage />
}
