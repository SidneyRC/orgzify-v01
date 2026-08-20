// THIS FILE GOES IN: app/(admin)/admin/ecosystem/page.tsx (REPLACES existing file)
import { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getServerSession } from "@/lib/auth";
import { getDownlineIds } from "@/lib/companyScope";
import { getActiveCompanyId } from "@/lib/activeCompanyContext";
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

// Resolves what a non-Super-Admin can see, based on their CURRENT ACTIVE
// company (same cookie the rights system already uses), not a raw single
// role lookup. Switching active company switches what they see here too.
// Returns null for Super Admin (no restriction).
async function getScopedEntityIds(session: any): Promise<string[] | null> {
  if (!session) return [];
  if (session.is_super_admin) return null;
  const cookieStore = await cookies();
  const activeCompanyId = await getActiveCompanyId(cookieStore);
  if (!activeCompanyId) return [];
  const companyIds = await getDownlineIds(activeCompanyId);
  const { data: userRows } = await supabaseAdmin.from("user_roles").select("user_id").in("company_id", companyIds).eq("is_active", true);
  const userIds = [...new Set((userRows || []).map((r: any) => r.user_id))];
  if (userIds.length === 0) return [];
  const { data: entRows } = await supabaseAdmin.from("entities").select("id").in("user_id", userIds);
  return (entRows || []).map((e: any) => e.id);
}

async function getActiveEntityCount(): Promise<number> {
  const session = await getServerSession();
  const entityIds = await getScopedEntityIds(session);
  if (entityIds && entityIds.length === 0) return 0;
  let q = supabaseAdmin.from("entities").select("*", { count: "exact", head: true }).eq("status", "active");
  if (entityIds) q = q.in("id", entityIds);
  const { count } = await q;
  return count ?? 0;
}

// Help Desk totals — assuming help_desk_tickets.status = 'closed' means
// resolved (everything else counts as Open). Flag if this doesn't match.
async function getHelpDeskSummary(): Promise<{ total: number; open: number }> {
  const { count: total } = await supabaseAdmin.from("help_desk_tickets").select("*", { count: "exact", head: true });
  const { count: open } = await supabaseAdmin.from("help_desk_tickets").select("*", { count: "exact", head: true }).neq("status", "closed");
  return { total: total ?? 0, open: open ?? 0 };
}

// Events totals — same active-company scoping as getActiveEntityCount.
async function getEventsSummary(): Promise<{ total: number; pending: number }> {
  const session = await getServerSession();
  const entityIds = await getScopedEntityIds(session);
  if (entityIds && entityIds.length === 0) return { total: 0, pending: 0 };
  let totalQuery = supabaseAdmin.from("events").select("*", { count: "exact", head: true }).neq("status", "deleted");
  let pendingQuery = supabaseAdmin.from("events").select("*", { count: "exact", head: true }).eq("status", "pending");
  if (entityIds) { totalQuery = totalQuery.in("entity_id", entityIds); pendingQuery = pendingQuery.in("entity_id", entityIds); }
  const { count: total } = await totalQuery;
  const { count: pending } = await pendingQuery;
  return { total: total ?? 0, pending: pending ?? 0 };
}

export default async function AdminEcosystemPage() {
  const session = await getServerSession();
  const [theme, entityCount, ticketSummary, helpDeskSummary, eventsSummary] = await Promise.all([
    getTheme(), getActiveEntityCount(), getTicketSummary(session), getHelpDeskSummary(), getEventsSummary()
  ]);
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
    {
      title: "Help Desk", description: "General support tickets raised by staff and entities",
      href: "/admin/ecosystem/helpdesk", meta: `Total : ${helpDeskSummary.total}  |  Open : ${helpDeskSummary.open}`,
      badge: helpDeskSummary.open > 0 ? "Open Tickets" : "All Clear",
      badgeColor: helpDeskSummary.open > 0 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700", icon: "🛎️",
    },
    {
      title: "Events", description: "Events submitted by organisers for review",
      href: "/admin/ecosystem/events", meta: `Total : ${eventsSummary.total}  |  Pending : ${eventsSummary.pending}`,
      badge: eventsSummary.pending > 0 ? "Pending Review" : "All Clear",
      badgeColor: eventsSummary.pending > 0 ? "bg-orange-100 text-orange-700" : "bg-green-100 text-green-700", icon: "🎟️",
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
