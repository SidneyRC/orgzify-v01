import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import OREV1063RegionAuthPage from '@/components/admin/OREV1-063-RegionAuthPage'

export default async function CompanyAuthRoute() {
  const session = await getServerSession()
  if (!session) redirect('/login')

  return <OREV1063RegionAuthPage />
}