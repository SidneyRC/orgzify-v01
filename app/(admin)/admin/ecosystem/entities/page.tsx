import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import OREV1054EntitiesPage from '@/components/admin/OREV1-054-EntitiesPage'

export default async function EntitiesListPage() {
  const cookieStore = await cookies()
  const { session, companyId } = await getActiveCompanyContext(cookieStore)
  if (!session) redirect('/login')

  let rights = { can_view: true, can_create: true, can_edit: true, can_delete: true, can_download_non_sensitive: true, can_archive: true, can_restore: true }
  if (companyId) {
    const allRights = await getFullCompanyRights(session.user_id, companyId)
    rights = {
      can_view: !!allRights.entities?.can_view,
      can_create: !!allRights.entities?.can_create,
      can_edit: !!allRights.entities?.can_edit,
      can_delete: !!allRights.entities?.can_delete,
      can_download_non_sensitive: !!allRights.entities?.can_download_non_sensitive,
      can_archive: !!allRights.entities?.can_archive,
      can_restore: !!allRights.entities?.can_restore,
    }
  }

  if (!rights.can_view) redirect('/access-denied')

  return (
    <OREV1054EntitiesPage
      canCreate={rights.can_create}
      canEdit={rights.can_edit}
      canDelete={rights.can_delete}
      canDownload={rights.can_download_non_sensitive}
      canArchive={rights.can_archive}
      canRestore={rights.can_restore}
    />
  )
}