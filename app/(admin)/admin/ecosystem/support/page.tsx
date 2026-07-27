import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import OREV1078SupportPage from '@/components/admin/OREV1-078-SupportPage'

export default async function SupportListPage() {
  const cookieStore = await cookies()
  const { session, companyId } = await getActiveCompanyContext(cookieStore)
  if (!session) redirect('/login')

  let rights = { can_view: true, can_edit: true, can_download_non_sensitive: true, can_overwrite_edit: true }
  if (companyId) {
    const allRights = await getFullCompanyRights(session.user_id, companyId)
    rights = {
      can_view: !!allRights.support?.can_view,
      can_edit: !!allRights.support?.can_edit,
      can_download_non_sensitive: !!allRights.support?.can_download_non_sensitive,
      can_overwrite_edit: !!allRights.support?.can_overwrite_edit,
    }
  }

  if (!rights.can_view) redirect('/access-denied')

  return (
    <OREV1078SupportPage
      canEdit={rights.can_edit}
      canDownload={rights.can_download_non_sensitive}
      canOverwriteEdit={rights.can_overwrite_edit}
    />
  )
}
