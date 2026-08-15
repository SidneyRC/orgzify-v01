// GOES IN: lib/adminModules.ts
export const ADMIN_MODULES = ['companies', 'location', 'assign_roles', 'geofence', 'themes', 'roles', 'entities', 'support', 'help_desk', 'categories', 'event_tags_format', 'countries', 'venue', 'events'] as const

export const ADMIN_MODULE_LABELS: Record<string, string> = {
  companies: 'Companies', location: 'Location', assign_roles: 'Assign Roles',
  geofence: 'Geofence', themes: 'Themes', roles: 'Roles & Rights',
  entities: 'Entities', support: 'Support', help_desk: 'Help Desk',
  categories: 'Help Desk Categories', event_tags_format: 'Event Tags Format',
  countries: 'Countries', venue: 'Venue', events: 'Events'
}

// Some pages don't support every standard right — e.g. Geofence rows are
// auto-created/deleted alongside their company, so Create/Delete don't apply there.
export const ADMIN_MODULE_RIGHTS: Record<string, string[]> = {
  geofence: ['can_view', 'can_edit', 'can_archive', 'can_download_non_sensitive'],
  // Countries is reference data pulled from an external source — no Create/Edit/Delete,
  // just View + the Sync right below.
  countries: ['can_view'],
}

// Extra, non-standard rights that only apply to specific modules.
// Not shown anywhere else, to avoid clutter on pages where they make no sense.
export const ADMIN_MODULE_EXTRA_RIGHTS: Record<string, string[]> = {
  venue: ['can_approve', 'can_restore', 'can_activate', 'can_hard_delete'],
  events: ['can_approve', 'can_restore', 'can_activate', 'can_hard_delete'],
  support: ['can_overwrite_edit'],
  help_desk: ['can_create', 'can_view_audit_trail', 'can_overwrite_edit'],
  entities: ['can_approve', 'can_restore', 'can_activate'],
  companies: ['can_approve'],
  categories: ['can_restore', 'can_hard_delete'],
  event_tags_format: ['can_restore'],
  countries: ['can_sync'],
}

// RESERVED rights (2-tier rule, locked): usable by whoever holds them, but never
// automatically passed down to sub-companies when a company sets up roles for its downline.
// Only Super Admin/Root can grant these directly, company by company.
// NOTE: enforcement of this rule on the Roles screen is a separate, not-yet-built task.
export const RESERVED_RIGHTS = ['can_archive', 'can_restore', 'can_hard_delete']
