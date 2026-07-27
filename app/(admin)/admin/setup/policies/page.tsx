import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import OREV1061PoliciesPage from '@/components/admin/OREV1-061-PoliciesPage'

export const metadata: Metadata = {
  title: 'Policies | Orgzify Admin',
  description: 'Manage Terms & Conditions, Privacy Policy and other platform policies',
}

export default async function PoliciesPage() {
  const session = await getServerSession()
  if (!session) redirect('/login')
  if (!session.is_super_admin) redirect('/access-denied')

  return <OREV1061PoliciesPage canDelete={true} />
}