import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import OREV1047CompaniesPage from '@/components/admin/OREV1-047-CompaniesPage'

export const metadata: Metadata = {
  title: 'Companies | Orgzify Admin',
  description: 'Manage all registered companies on the Orgzify platform',
  openGraph: {
    title: 'Companies | Orgzify Admin',
    description: 'Manage all registered companies',
  },
}

export default async function CompaniesPage() {
  const cookieStore = await cookies()
  const { session, companyId, slug } = await getActiveCompanyContext(cookieStore)
  if (!session) redirect('/login')

  const backLink = companyId ? `/company/${slug}/setup` : '/admin/setup'

  // Super Admin (no active company context) gets full rights.
  // Otherwise, look up real per-button rights for the companies module.
  let rights = { can_view: true, can_create: true, can_edit: true, can_delete: true, can_download_non_sensitive: true }
  if (companyId) {
    const allRights = await getFullCompanyRights(session.user_id, companyId)
    rights = {
      can_view: !!allRights.companies?.can_view,
      can_create: !!allRights.companies?.can_create,
      can_edit: !!allRights.companies?.can_edit,
      can_delete: !!allRights.companies?.can_delete,
      can_download_non_sensitive: !!allRights.companies?.can_download_non_sensitive,
    }
  }

  if (!rights.can_view) redirect('/access-denied')

  return (
    <OREV1047CompaniesPage
      ownCompanyId={companyId}
      backLink={backLink}
      canCreate={rights.can_create}
      canEdit={rights.can_edit}
      canDelete={rights.can_delete}
      canDownload={rights.can_download_non_sensitive}
    />
  )
}