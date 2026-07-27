import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import OREV1062PolicyForm from '@/components/admin/OREV1-062-PolicyForm'

export const metadata: Metadata = {
  title: 'Policy | Orgzify Admin',
  description: 'Create or edit a policy',
}

export default async function PolicyFormPage({ searchParams }: { searchParams: Promise<{ id?: string; mode?: string }> }) {
  const session = await getServerSession()
  if (!session) redirect('/login')
  if (!session.is_super_admin) redirect('/access-denied')

  const { id, mode } = await searchParams

  return <OREV1062PolicyForm policyId={id || null} viewOnly={mode === 'view'} />
}