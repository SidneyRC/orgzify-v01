export const ADMIN_MODULES = ['companies', 'location', 'assign_roles', 'geofence', 'themes', 'roles', 'entities', 'support'] as const

export const ADMIN_MODULE_LABELS: Record<string, string> = {
  companies: 'Companies', location: 'Location', assign_roles: 'Assign Roles',
  geofence: 'Geofence', themes: 'Themes', roles: 'Roles & Rights',
  entities: 'Entities', support: 'Support'
}

// Some pages don't support every standard right — e.g. Geofence rows are
// auto-created/deleted alongside their company, so Create/Delete don't apply there.
export const ADMIN_MODULE_RIGHTS: Record<string, string[]> = {
  geofence: ['can_view', 'can_edit', 'can_archive', 'can_download_non_sensitive'],
}

// Extra, non-standard rights that only apply to specific modules.
// Not shown anywhere else, to avoid clutter on pages where they make no sense.
export const ADMIN_MODULE_EXTRA_RIGHTS: Record<string, string[]> = {
  support: ['can_overwrite_edit'],
  entities: ['can_approve', 'can_restore', 'can_activate'],
  companies: ['can_approve'],
}