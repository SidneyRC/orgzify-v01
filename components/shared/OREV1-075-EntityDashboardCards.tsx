// THIS FILE GOES IN: components/shared/OREV1-075-EntityDashboardCards.tsx (NEW FILE)
"use client";
import Link from "next/link";
import { Theme } from "@/lib/ThemeContext";
import { User, LayoutTemplate, GraduationCap, CalendarDays, LucideIcon } from "lucide-react";

type ModuleAccess = { pages: boolean; academy: boolean; events: boolean };

export default function EntityDashboardCards({ processId, entitySlug, moduleAccess, theme, radius }: {
  processId: string; entitySlug: string; moduleAccess: ModuleAccess; theme: Theme | null; radius: string;
}) {
  const cardStyle = { boxShadow: theme?.card_shadow || "0 1px 3px rgba(0,0,0,0.06)", borderRadius: radius };
  const iconBg = theme?.badge_success_bg || "#dcfce7";
  const iconColor = theme?.color_primary || "#1e3a5f";
  const mutedColor = theme?.color_text_muted || "#9ca3af";
  const linkColor = theme?.link_color || "#1e3a5f";

  const cards: { key: string; Icon: LucideIcon; title: string; desc: string; href?: string; show: boolean }[] = [
    { key: "profile", Icon: User, title: "Profile", desc: "View your submitted registration details", href: `/biz/register?ref=${processId}&mode=view`, show: true },
    { key: "pages", Icon: LayoutTemplate, title: "Pages", desc: "Set up your front-end profile page", show: moduleAccess.pages },
    { key: "academy", Icon: GraduationCap, title: "Academy", desc: "Academy controls", show: moduleAccess.academy },
    { key: "events", Icon: CalendarDays, title: "Events", desc: "Events creation and setup", href: `/biz/${entitySlug}/events`, show: moduleAccess.events },
  ].filter(c => c.show);

  return (
    <div className="flex flex-wrap gap-4">
      {cards.map(({ key, Icon, title, desc, href }) => {
        const body = (
          <div style={{ ...cardStyle, height: 180 }} className="bg-white p-5 h-full w-full transition-shadow hover:shadow-lg cursor-pointer">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: iconBg }}>
              <Icon size={20} color={iconColor} />
            </div>
            <p className="font-semibold text-gray-800 mb-1">{title}</p>
            <p className="text-xs mb-3" style={{ color: mutedColor }}>{desc}</p>
            {href
              ? <span className="text-xs font-semibold" style={{ color: linkColor }}>Open →</span>
              : <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-400">Coming Soon</span>}
          </div>
        );
        return href
          ? <Link key={key} href={href} className="flex-1 min-w-[200px]">{body}</Link>
          : <div key={key} className="flex-1 min-w-[200px]">{body}</div>;
      })}
    </div>
  );
}
