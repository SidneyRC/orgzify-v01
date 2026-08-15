import { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "@/lib/auth";
import { getDownlineIds } from "@/lib/companyScope";

export const metadata: Metadata = {
  title: "Master — Orgzify Admin",
  description: "Platform-wide master data",
};

const DEFAULT_THEME_ID = "5ad85f55-6fab-4db2-a8e3-b1507a39de86";

async function getTheme() {
  const { data } = await supabaseAdmin.from("company_themes")
    .select("page_bg, color_text_primary, color_text_muted, global_border_radius")
    .eq("id", DEFAULT_THEME_ID).maybeSingle();
  return data;
}

async function getCounts() {
  const [{ count: l1 }, { count: l2 }, { count: tags }] = await Promise.all([
    supabaseAdmin.from("categories").select("*", { count: "exact", head: true }).eq("level", 1).eq("status", "active"),
    supabaseAdmin.from("categories").select("*", { count: "exact", head: true }).eq("level", 2).eq("status", "active"),
    supabaseAdmin.from("event_tags_format").select("*", { count: "exact", head: true }).eq("status", "active"),
  ]);
  return { l1: l1 ?? 0, l2: l2 ?? 0, tags: tags ?? 0 };
}

// Active venues, scoped to the logged-in user's company + downline via
// venues.company_id directly — Super Admin sees the platform-wide count.
async function getActiveVenueCount(): Promise<number> {
  const session = await getServerSession();
  if (!session) return 0;

  if (!session.is_super_admin) {
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles").select("company_id")
      .eq("user_id", session.user_id).eq("is_active", true).maybeSingle();
    if (!roleRow?.company_id) return 0;
    const companyIds = await getDownlineIds(roleRow.company_id);
    const { count } = await supabaseAdmin.from("venues").select("*", { count: "exact", head: true }).eq("status", "active").in("company_id", companyIds);
    return count ?? 0;
  }

  const { count } = await supabaseAdmin.from("venues").select("*", { count: "exact", head: true }).eq("status", "active");
  return count ?? 0;
}

export default async function MasterPage() {
  const [theme, counts, venueCount] = await Promise.all([getTheme(), getCounts(), getActiveVenueCount()]);
  const radius = theme?.global_border_radius || "12px";
  const textPrimary = theme?.color_text_primary || "#111827";
  const textMuted = theme?.color_text_muted || "#9ca3af";

  const cards = [
    {
      title: "Categories", description: "Category & Sub-category master used across Events and Academy",
      href: "/admin/master/categories", meta: `Category : ${counts.l1}  |  Sub Category : ${counts.l2}`, icon: "🗂️",
    },
    {
      title: "Event Tags Format", description: "Format tags used across Events (e.g. Kids, Competition, Workshop)",
      href: "/admin/master/event-tags-format", meta: `Tag : ${counts.tags}`, icon: "🏷️",
    },
    {
      title: "Venue", description: "Physical locations used for Events and future modules",
      href: "/admin/master/venue", meta: `Active Venue : ${venueCount}`, icon: "📍",
    },
  ];

  return (
    <div className="p-6 pr-8" style={{ backgroundColor: theme?.page_bg }}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: textPrimary }}>Master</h1>
        <p className="text-sm mt-1" style={{ color: textMuted }}>Platform-wide master data</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link key={card.title} href={card.href} style={{ borderRadius: radius }}
            className="bg-white border border-gray-100 p-7 hover:shadow-lg transition-shadow flex flex-col gap-4">
            <span className="text-4xl">{card.icon}</span>
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
