import { supabaseAdmin } from "@/lib/supabaseAdmin";

// EXISTING — kept exactly as-is, still used wherever we only need
// "does this person have any access to this module at all".
export async function getCompanyRights(user_id: string, company_id: string): Promise<string[]> {
  const { data: roles, error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user_id)
    .eq("company_id", company_id)
    .eq("is_active", true);

  if (roleErr || !roles || roles.length === 0) return [];

  const roleIds = roles.map(r => r.role_id);

  const { data: perms, error: permErr } = await supabaseAdmin
    .from("role_permissions")
    .select("module")
    .in("role_id", roleIds)
    .eq("can_view", true);

  if (permErr || !perms) return [];

  return Array.from(new Set(perms.map(p => p.module)));
}

// NEW — returns the actual flags per module, e.g.
// { geofence: { can_view: true, can_edit: false, can_create: false, ... } }
// Use this whenever a page needs to show/hide individual buttons
// (Edit, Create, Delete, Archive, Download) based on real rights.
export type ModuleRights = {
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  can_archive: boolean
  can_download_non_sensitive: boolean
}

export async function getFullCompanyRights(user_id: string, company_id: string): Promise<Record<string, ModuleRights>> {
  const { data: roles, error: roleErr } = await supabaseAdmin
    .from("user_roles")
    .select("role_id")
    .eq("user_id", user_id)
    .eq("company_id", company_id)
    .eq("is_active", true);

  if (roleErr || !roles || roles.length === 0) return {};

  const roleIds = roles.map(r => r.role_id);

  const { data: perms, error: permErr } = await supabaseAdmin
    .from("role_permissions")
    .select("module, can_view, can_create, can_edit, can_delete, can_archive, can_download_non_sensitive")
    .in("role_id", roleIds);

  if (permErr || !perms) return {};

  const result: Record<string, ModuleRights> = {};
  for (const p of perms) {
    const existing = result[p.module];
    // If a person has more than one active role granting the same module,
    // combine them — any role granting a right is enough (most permissive wins).
    result[p.module] = {
      can_view: !!p.can_view || !!existing?.can_view,
      can_create: !!p.can_create || !!existing?.can_create,
      can_edit: !!p.can_edit || !!existing?.can_edit,
      can_delete: !!p.can_delete || !!existing?.can_delete,
      can_archive: !!p.can_archive || !!existing?.can_archive,
      can_download_non_sensitive: !!p.can_download_non_sensitive || !!existing?.can_download_non_sensitive,
    };
  }
  return result;
}
