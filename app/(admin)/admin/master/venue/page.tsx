// GOES IN: app/(admin)/admin/master/venue/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import OREV1091VenuesPage from '@/components/admin/OREV1-091-VenuesPage'

export default async function VenueListPage() {
  const cookieStore = await cookies()
  const { session, companyId } = await getActiveCompanyContext(cookieStore)
  if (!session) redirect('/login')

  // Super Admin with no active company context (main Admin Panel) gets full access.
  let rights = { can_view: true, can_create: true, can_edit: true, can_delete: true, can_restore: true, can_hard_delete: true, can_activate: true, can_approve: true, can_download_non_sensitive: true }

  if (companyId) {
    const allRights = await getFullCompanyRights(session.user_id, companyId)
    rights = {
      can_view: !!allRights.venue?.can_view,
      can_create: !!allRights.venue?.can_create,
      can_edit: !!allRights.venue?.can_edit,
      can_delete: !!allRights.venue?.can_delete,
      can_restore: !!allRights.venue?.can_restore,
      can_hard_delete: !!allRights.venue?.can_hard_delete,
      can_activate: !!allRights.venue?.can_activate,
      can_approve: !!allRights.venue?.can_approve,
      can_download_non_sensitive: !!allRights.venue?.can_download_non_sensitive,
    }
  }

  if (!rights.can_view) redirect('/access-denied')

  return (
    <OREV1091VenuesPage
      canCreate={rights.can_create}
      canEdit={rights.can_edit}
      canDelete={rights.can_delete}
      canRestore={rights.can_restore}
      canHardDelete={rights.can_hard_delete}
      canActivate={rights.can_activate}
      canApprove={rights.can_approve}
      canDownload={rights.can_download_non_sensitive}
    />
  )
}
