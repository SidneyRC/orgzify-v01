// GOES IN: app/(admin)/admin/master/categories/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import OREV1077CategoriesPage from '@/components/admin/OREV1-077-CategoriesPage'

export default async function CategoriesListPage() {
  const cookieStore = await cookies()
  const { session, companyId } = await getActiveCompanyContext(cookieStore)
  if (!session) redirect('/login')

  let rights = { can_view: true, can_create: true, can_edit: true, can_delete: true, can_archive: true, can_restore: true, can_download_non_sensitive: true, can_hard_delete: true }
  if (!session.is_super_admin && companyId) {
    const allRights = await getFullCompanyRights(session.user_id, companyId)
    rights = {
      can_view: !!allRights.categories?.can_view,
      can_create: !!allRights.categories?.can_create,
      can_edit: !!allRights.categories?.can_edit,
      can_delete: !!allRights.categories?.can_delete,
      can_archive: !!allRights.categories?.can_archive,
      can_restore: !!allRights.categories?.can_restore,
      can_download_non_sensitive: !!allRights.categories?.can_download_non_sensitive,
      can_hard_delete: !!allRights.categories?.can_hard_delete,
    }
  }

  if (!rights.can_view) redirect('/access-denied')

  return (
    <OREV1077CategoriesPage
      canCreate={rights.can_create}
      canEdit={rights.can_edit}
      canDelete={rights.can_delete}
      canViewArchived={rights.can_archive}
      canRestore={rights.can_restore}
      canDownload={rights.can_download_non_sensitive}
      canHardDelete={rights.can_hard_delete}
    />
  )
}
