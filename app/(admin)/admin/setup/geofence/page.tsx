// THIS FILE GOES IN: app/(admin)/admin/setup/geofence/page.tsx
// Checks the active company cookie + real, per-button rights before deciding what to show.
// Back link is resolved from the cookie too — no hardcoded routes.

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveCompanyContext } from '@/lib/activeCompanyContext'
import { getFullCompanyRights } from '@/lib/getCompanyRights'
import OREV1048GeofencePage from '@/components/admin/OREV1-048-GeofencePage'

export const metadata = { title: 'Geofence — Orgzify Admin' }

export default async function GeofencePage() {
  const cookieStore = await cookies()
  const { session, companyId, slug } = await getActiveCompanyContext(cookieStore)
  if (!session) redirect('/login')

  // No company context — Super Admin / Admin Panel behavior, full access, unchanged
  if (!companyId) {
    return <OREV1048GeofencePage isSuperAdmin={true} canEdit={true} canDownload={true} canViewArchived={true} backLink="/admin/setup" />
  }

  // Inside a specific company — resolve real per-button rights
  const rights = await getFullCompanyRights(session.user_id, companyId)
  const geofenceRights = rights['geofence']
  if (!geofenceRights?.can_view) redirect('/access-denied')

  const backLink = `/company/${slug}/setup`
  return (
    <OREV1048GeofencePage
      isSuperAdmin={false}
      canEdit={!!geofenceRights.can_edit}
      canDownload={!!geofenceRights.can_download_non_sensitive}
      canViewArchived={!!geofenceRights.can_archive}
      ownCompanyId={companyId}
      backLink={backLink}
    />
  )
}
