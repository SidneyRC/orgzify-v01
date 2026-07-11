import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import OREV1050AssignRolePage from '@/components/admin/OREV1-050-AssignRolePage'

export const metadata: Metadata = {
  title: 'Assign Roles | Orgzify Admin',
  description: 'Assign roles and rights to users across companies.',
}

export default async function Page() {
  const cookieStore = await cookies()
  const { session, companyId, slug } = await getActiveCompanyContext(cookieStore)
  if (!session) redirect('/login')

  const backLink = companyId ? `/company/${slug}/setup` : '/admin/setup'

  let rights = { can_view: true, can_create: true, can_edit: true, can_archive: true, can_download_non_sensitive: true }
  if (companyId) {
    const allRights = await getFullCompanyRights(session.user_id, companyId)
    rights = {
      can_view: !!allRights.assign_roles?.can_view,
      can_create: !!allRights.assign_roles?.can_create,
      can_edit: !!allRights.assign_roles?.can_edit,
      can_archive: !!allRights.assign_roles?.can_archive,
      can_download_non_sensitive: !!allRights.assign_roles?.can_download_non_sensitive,
    }
  }

  if (!rights.can_view) redirect('/access-denied')

  return (
    <OREV1050AssignRolePage
      ownCompanyId={companyId}
      backLink={backLink}
      canCreate={rights.can_create}
      canEdit={rights.can_edit}
      canArchive={rights.can_archive}
      canDownload={rights.can_download_non_sensitive}
    />
  )
}