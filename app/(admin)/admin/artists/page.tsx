// THIS FILE GOES IN: app/admin/artists/page.tsx (NEW FILE)
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import OREV1119ArtistsAdminPage from '@/components/admin/OREV1-119-ArtistsAdminPage'

export default async function ArtistsListPage() {
  const cookieStore = await cookies()
  const { session } = await getActiveCompanyContext(cookieStore)
  if (!session) redirect('/login')

  return <OREV1119ArtistsAdminPage />
}
