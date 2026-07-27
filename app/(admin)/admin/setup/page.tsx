// OREV1-043 — Admin Setup Page — /admin/setup
// Card grid — 3 per row — links to each setup section

import { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const metadata: Metadata = {
  title: "Setup — Orgzify Admin",
  description: "Platform setup and configuration",
};

const DEFAULT_THEME_ID = "5ad85f55-6fab-4db2-a8e3-b1507a39de86";

async function getTheme() {
  const { data } = await supabaseAdmin.from("company_themes").select("page_bg, color_text_primary, color_text_muted, global_border_radius").eq("id", DEFAULT_THEME_ID).maybeSingle();
  return data;
}

async function getCompanyCount() {
  const { count } = await supabaseAdmin.from("companies").select("*", { count: "exact", head: true }).eq("company_status", "active");
  return count ?? 0;
}

async function getGeofenceStats() {
  const { data: covered } = await supabaseAdmin.from("branch_coverage").select("company_id, country_id, state_id");
  const companies = new Set((covered || []).map((r: any) => r.company_id)).size;
  const countries = new Set((covered || []).filter((r: any) => !r.state_id).map((r: any) => r.country_id)).size;
  const states = new Set((covered || []).filter((r: any) => !!r.state_id).map((r: any) => r.state_id)).size;
  return { companies, countries, states };
}

async function getRoleStats() {
  const { count } = await supabaseAdmin.from("admin_roles").select("*", { count: "exact", head: true }).eq("status", "active");
  return count ?? 0;
}

async function getAssignRoleStats() {
  const { data } = await supabaseAdmin.from("user_roles").select("company_id").eq("is_active", true);
  const companies = new Set((data || []).map((r: any) => r.company_id)).size;
  return { companies, assigned: (data || []).length };
}

async function getPolicyStats() {
  const { data } = await supabaseAdmin.from("policies").select("country_id").eq("status", "active");
  const countries = new Set((data || []).filter((r: any) => !!r.country_id).map((r: any) => r.country_id)).size;
  return { countries, active: (data || []).length };
}

export default async function AdminSetupPage() {
  const [theme, companyCount, geofenceStats, roleCount, assignStats, policyStats] = await Promise.all([
    getTheme(), getCompanyCount(), getGeofenceStats(), getRoleStats(), getAssignRoleStats(), getPolicyStats()
  ]);
  const radius = theme?.global_border_radius || "12px";
  const textPrimary = theme?.color_text_primary || "#111827";
  const textMuted = theme?.color_text_muted || "#9ca3af";

  const cards = [
    {
      title: "Companies", description: "Manage all registered companies",
      href: "/admin/setup/companies", meta: `${companyCount} active`,
      badge: companyCount > 0 ? "Active" : "Not set up",
      badgeColor: companyCount > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500", icon: "🏢",
    },
    {
      title: "Geofence", description: "Assign territory coverage to branches",
      href: "/admin/setup/geofence",
      meta: `Companies: ${geofenceStats.companies} | Countries: ${geofenceStats.countries} | States: ${geofenceStats.states}`,
      badge: geofenceStats.companies > 0 ? "Active" : "Not set up",
      badgeColor: geofenceStats.companies > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500", icon: "🗺️",
    },
    {
      title: "Roles & Rights", description: "Define roles and permissions per company",
      href: "/admin/setup/roles", meta: `Role: ${roleCount}`,
      badge: roleCount > 0 ? "Active" : "Not set up",
      badgeColor: roleCount > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500", icon: "🔐",
    },
    {
      title: "Assign Roles", description: "Assign roles to users across companies",
      href: "/admin/setup/assign-role", meta: `Companies: ${assignStats.companies} | Assigned: ${assignStats.assigned}`,
      badge: assignStats.assigned > 0 ? "Active" : "Not set up",
      badgeColor: assignStats.assigned > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500", icon: "🧑‍💼",
  },
    {
      title: "Themes", description: "Manage brand colour themes",
      href: "/admin/setup/themes", meta: "Platform wide",
      badge: "Active", badgeColor: "bg-green-100 text-green-700", icon: "🎨",
    },
    {
      title: "Policies", description: "Terms & Conditions, Privacy Policy and more",
      href: "/admin/setup/policies", meta: `Country : ${policyStats.countries} | Policy : ${policyStats.active}`,
      badge: policyStats.active > 0 ? "Active" : "Not set up",
      badgeColor: policyStats.active > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500", icon: "📜",
    },
  ];

  return (
    <div className="p-6 pr-8" style={{ backgroundColor: theme?.page_bg }}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: textPrimary }}>Setup</h1>
        <p className="text-sm mt-1" style={{ color: textMuted }}>Company-level configuration</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} style={{ borderRadius: radius }}
            className="bg-white border border-gray-100 p-7 hover:shadow-lg transition-shadow flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <span className="text-4xl">{card.icon}</span>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${card.badgeColor}`}>{card.badge}</span>
            </div>
            <div>
              <p className="text-base font-semibold" style={{ color: textPrimary }}>{card.title}</p>
              <p className="text-sm mt-0.5" style={{ color: textMuted }}>{card.description}</p>
            </div>
            <p className="text-xs border-t border-gray-50 pt-2" style={{ color: textMuted }}>{card.meta}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
