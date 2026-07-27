import { Metadata } from "next";
import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "@/lib/auth";
import { getDownlineIds } from "@/lib/companyScope";
import { getTicketSummary } from "@/lib/getTicketSummary";

export const metadata: Metadata = {
  title: "Ecosystem — Orgzify Admin",
  description: "Partner and organiser ecosystem",
};

const DEFAULT_THEME_ID = "5ad85f55-6fab-4db2-a8e3-b1507a39de86";

async function getTheme() {
  const { data } = await supabaseAdmin.from("company_themes").select("page_bg, color_text_primary, color_text_muted, global_border_radius").eq("id", DEFAULT_THEME_ID).maybeSingle();
  return data;
}

// Active Entities scoped to the logged-in user's company + its downline —
// found via each Entity's Authorised Person -> their company (user_roles).
// Not using reporting_company_id (being dropped going forward).
async function getActiveEntityCount(): Promise<number> {
  const session = await getServerSession();
  if (!session) return 0;

  let companyIds: string[] | null = null; // null = Super Admin, no scoping

  if (!session.is_super_admin) {
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles").select("company_id")
      .eq("user_id", session.user_id).eq("is_active", true).maybeSingle();
    if (!roleRow?.company_id) return 0;
    companyIds = await getDownlineIds(roleRow.company_id);
  }

  if (companyIds) {
    const { data: userRows } = await supabaseAdmin
      .from("user_roles").select("user_id").in("company_id", companyIds).eq("is_active", true);
    const userIds = [...new Set((userRows || []).map((r: any) => r.user_id))];
    if (userIds.length === 0) return 0;
    const { count } = await supabaseAdmin
      .from("entities").select("*", { count: "exact", head: true }).eq("status", "active").in("user_id", userIds);
    return count ?? 0;
  }

  const { count } = await supabaseAdmin.from("entities").select("*", { count: "exact", head: true }).eq("status", "active");
  return count ?? 0;
}

export default async function AdminEcosystemPage() {
  const session = await getServerSession();
  const [theme, entityCount, ticketSummary] = await Promise.all([getTheme(), getActiveEntityCount(), getTicketSummary(session)]);
  const radius = theme?.global_border_radius || "12px";
  const textPrimary = theme?.color_text_primary || "#111827";
  const textMuted = theme?.color_text_muted || "#9ca3af";

  const cards = [
    {
      title: "Entity", description: "Partners and organisers on the platform",
      href: "/admin/ecosystem/entities", meta: `Active Entity : ${entityCount}`,
      badge: entityCount > 0 ? "Active" : "Not set up",
      badgeColor: entityCount > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500", icon: "🤝",
    },
    {
      title: "Support", description: "Tickets raised during entity registration",
      href: "/admin/ecosystem/support", meta: `Total : ${ticketSummary.total}  |  Open : ${ticketSummary.open}`,
      badge: ticketSummary.open > 0 ? "Open Tickets" : "All Clear",
      badgeColor: ticketSummary.open > 0 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700", icon: "🎫",
    },
  ];

  return (
    <div className="p-6 pr-8" style={{ backgroundColor: theme?.page_bg }}>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold" style={{ color: textPrimary }}>Ecosystem</h1>
        <p className="text-sm mt-1" style={{ color: textMuted }}>Partner and organiser management</p>
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