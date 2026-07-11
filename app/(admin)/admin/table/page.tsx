// OREV1-052 — Admin Table Page — /admin/table
// Card grid — matches Setup page style exactly

import { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const metadata: Metadata = {
  title: "Table — Orgzify Admin",
  description: "Raw data used directly across the app",
};

const DEFAULT_THEME_ID = "5ad85f55-6fab-4db2-a8e3-b1507a39de86";

async function getTheme() {
  const { data } = await supabaseAdmin.from("company_themes").select("page_bg, color_text_primary, color_text_muted, global_border_radius").eq("id", DEFAULT_THEME_ID).maybeSingle();
  return data;
}

async function getCountryStats() {
  const { count } = await supabaseAdmin.from("country_master").select("*", { count: "exact", head: true });
  const { data: latest } = await supabaseAdmin.from("country_master").select("created_at").order("created_at", { ascending: false }).limit(1).single();
  const lastSync = latest?.created_at ? new Date(latest.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;
  const isDue = latest?.created_at ? (Date.now() - new Date(latest.created_at).getTime()) > 30 * 24 * 60 * 60 * 1000 : true;
  return { lastSync, isDue };
}

async function getLocationStats() {
  const { count: stateCount } = await supabaseAdmin.from("locations").select("*", { count: "exact", head: true }).eq("level", "state");
  const { data: countryData } = await supabaseAdmin.from("locations").select("country_id");
  const uniqueCountries = new Set((countryData || []).map((r: any) => r.country_id)).size;
  return { stateCount: stateCount ?? 0, countryCount: uniqueCountries };
}

export default async function AdminTablePage() {
  const [theme, countryStats, locationStats] = await Promise.all([getTheme(), getCountryStats(), getLocationStats()]);
  const radius = theme?.global_border_radius || "12px";
  const textPrimary = theme?.color_text_primary || "#111827";
  const textMuted = theme?.color_text_muted || "#9ca3af";

  const cards = [
    {
      title: "Countries", description: "Sync country data from restcountries.com",
      href: "/admin/setup/countries",
      meta: countryStats.lastSync ? `Last sync: ${countryStats.lastSync}` : "Never synced",
      badge: countryStats.isDue ? "Sync Due" : "Up to date",
      badgeColor: countryStats.isDue ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700", icon: "🌍",
    },
    {
      title: "Locations", description: "Manage states, districts and cities",
      href: "/admin/setup/locations",
      meta: `Countries: ${locationStats.countryCount} | States: ${locationStats.stateCount}`,
      badge: locationStats.stateCount > 0 ? "Active" : "Not set up",
      badgeColor: locationStats.stateCount > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500", icon: "📍",
    },
    {
      title: "Pincodes", description: "Manage pincode master data",
      href: "/admin/setup/pincodes", meta: "Linked to locations",
      badge: "Active", badgeColor: "bg-green-100 text-green-700", icon: "📮",
    },
  ];

  return (
    <div className="p-6 pr-8" style={{ backgroundColor: theme?.page_bg }}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: textPrimary }}>Table</h1>
        <p className="text-sm mt-1" style={{ color: textMuted }}>Raw data used directly across the app</p>
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
