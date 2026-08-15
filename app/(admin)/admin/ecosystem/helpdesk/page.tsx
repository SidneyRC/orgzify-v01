// GOES IN: app/(admin)/admin/ecosystem/helpdesk/page.tsx
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import OREV1082HelpDeskPage from '@/components/admin/OREV1-082-HelpDeskPage'

export default async function HelpDeskListPage() {
  const cookieStore = await cookies()
  const { session, companyId } = await getActiveCompanyContext(cookieStore)
  if (!session) redirect('/login')

  let rights = { can_view: true, can_create: true, can_edit: true, can_view_audit_trail: true, can_overwrite_edit: true }
  if (companyId && !session.is_super_admin) {
    const allRights = await getFullCompanyRights(session.user_id, companyId)
    rights = {
      can_view: !!allRights.help_desk?.can_view,
      can_create: !!allRights.help_desk?.can_create,
      can_edit: !!allRights.help_desk?.can_edit,
      can_view_audit_trail: !!allRights.help_desk?.can_view_audit_trail,
      can_overwrite_edit: !!allRights.help_desk?.can_overwrite_edit,
    }
  }

  if (!session.is_super_admin && !rights.can_view) redirect('/access-denied')

  return (
    <OREV1082HelpDeskPage
      canCreate={rights.can_create}
      canEdit={rights.can_edit}
      canViewAuditTrail={rights.can_view_audit_trail}
      canOverwriteEdit={rights.can_overwrite_edit}
    />
  )
}
