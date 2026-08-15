// GOES IN: app/(admin)/admin/setup/countries/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import OREV1079CountriesClient from './OREV1-079-CountriesClient'

export default async function CountriesPage() {
  const cookieStore = await cookies()
  const { session, companyId } = await getActiveCompanyContext(cookieStore)
  if (!session) redirect('/login')

  let rights = { can_view: true, can_sync: true }
  if (!session.is_super_admin && companyId) {
    const allRights = await getFullCompanyRights(session.user_id, companyId)
    rights = {
      can_view: !!(allRights.countries as any)?.can_view,
      can_sync: !!(allRights.countries as any)?.can_sync,
    }
  }

  if (!rights.can_view) redirect('/access-denied')

  return <OREV1079CountriesClient canSync={rights.can_sync} />
}
