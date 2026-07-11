import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import OREV1049RolesPage from '@/components/admin/OREV1-049-RolesPage'

export const metadata: Metadata = {
  title: 'Roles & Rights | Orgzify Admin',
  description: 'Manage roles and permissions on the Orgzify platform',
  openGraph: {
    title: 'Roles & Rights | Orgzify Admin',
    description: 'Manage roles and permissions',
  },
}

export default async function RolesPage() {
  const cookieStore = await cookies()
  const { session, companyId, slug } = await getActiveCompanyContext(cookieStore)
  if (!session) redirect('/login')

  const backLink = companyId ? `/company/${slug}/setup` : '/admin/setup'

  let rights = { can_view: true, can_create: true, can_edit: true, can_delete: true, can_download_non_sensitive: true }
  if (companyId) {
    const allRights = await getFullCompanyRights(session.user_id, companyId)
    rights = {
      can_view: !!allRights.roles?.can_view,
      can_create: !!allRights.roles?.can_create,
      can_edit: !!allRights.roles?.can_edit,
      can_delete: !!allRights.roles?.can_delete,
      can_download_non_sensitive: !!allRights.roles?.can_download_non_sensitive,
    }
  }

  if (!rights.can_view) redirect('/access-denied')

  return (
    <OREV1049RolesPage
      ownCompanyId={companyId}
      backLink={backLink}
      canCreate={rights.can_create}
      canEdit={rights.can_edit}
      canDelete={rights.can_delete}
      canDownload={rights.can_download_non_sensitive}
    />
  )
}