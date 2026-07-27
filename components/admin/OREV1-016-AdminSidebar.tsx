"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Users, CalendarDays, GraduationCap, Building2, Settings, Database, Table, LogOut, ChevronRight, X, Network } from "lucide-react";
import { DesktopNavItem, SectionLabel, MobileNavItem, MobileSectionLabel } from "@/components/admin/OREV1-016A-SidebarNavItems";

const mainNav = [
  { icon: LayoutDashboard, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Users", href: "/admin/users" },
  { icon: CalendarDays, label: "Events", href: "/admin/events" },
  { icon: GraduationCap, label: "Academies", href: "/admin/academies" },
  { icon: Building2, label: "Organisations", href: "/admin/organisations" },
];
const masterNav = [{ icon: Database, label: "Master Data", href: "/admin/master" }, { icon: Table, label: "Table", href: "/admin/table" }];
const setupNav = [{ icon: Settings, label: "Setup", href: "/admin/setup" }];
const ecosystemNav = [{ icon: Network, label: "Ecosystem", href: "/admin/ecosystem" }];
const companySetupHref = (slug: string) => `/company/${slug}/setup`;

interface Props {
  expanded: boolean; setExpanded: (v: boolean) => void;
  mobileOpen: boolean; setMobileOpen: (v: boolean) => void;
  companyName?: string; roleLabel?: string; rights?: string[]; slug?: string;
}

export default function AdminSidebar({ expanded, setExpanded, mobileOpen, setMobileOpen, companyName, roleLabel, rights, slug }: Props) {
  const pathname = usePathname();
  const isCompanyMode = !!companyName;
  const showSetup = !isCompanyMode || (rights ?? []).some(r => ["companies", "location"].includes(r));
  const companyDashboardHref = `/company/${slug}/dashboard`;
  const visibleMain = isCompanyMode
    ? mainNav.filter(i => i.label === "Dashboard").map(i => ({ ...i, href: companyDashboardHref }))
    : mainNav;
  const visibleSetup = showSetup
    ? (isCompanyMode ? [{ icon: Settings, label: "Setup", href: companySetupHref(slug!) }] : setupNav)
    : [];
  const visibleMaster = isCompanyMode ? [] : masterNav;
  const showEcosystem = !isCompanyMode || (rights ?? []).some(r => ["entities", "support"].includes(r));
  const visibleEcosystem = showEcosystem ? ecosystemNav : [];
  const topTitle = isCompanyMode ? companyName! : "ORGZIFY";
  const topSubtitle = isCompanyMode ? (roleLabel ?? "") : "Super Admin";

  useEffect(() => { setMobileOpen(false); }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  const isActive = (href: string) => href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <>
      <aside className={`hidden md:flex flex-col h-screen bg-blue-900 border-r border-blue-800 shrink-0 transition-all duration-300 ${expanded ? "w-52" : "w-14"}`}>
        <div className="flex items-center justify-between px-2 py-3 border-b border-blue-800 min-h-[56px]">
          <div className={`transition-all duration-300 overflow-hidden ${expanded ? "opacity-100 max-w-[160px] pl-1" : "opacity-0 max-w-0"}`}>
            <div className="text-white font-bold text-sm leading-none truncate max-w-[140px]">{topTitle}</div>
            <div className="text-blue-300 text-[10px] mt-1 whitespace-nowrap">{topSubtitle}</div>
          </div>
          <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-md text-blue-300 hover:text-white hover:bg-blue-800 transition-colors ml-auto">
            <ChevronRight size={16} className={`transition-transform duration-300 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
        <nav className="flex-1 py-3 space-y-0.5 overflow-hidden">
          {visibleMain.map(item => <DesktopNavItem key={item.href} item={item} expanded={expanded} isActive={isActive(item.href)} />)}
          {visibleMaster.length > 0 && !isCompanyMode && <SectionLabel label="Master Data" expanded={expanded} />}
          {visibleMaster.map(item => <DesktopNavItem key={item.href} item={item} expanded={expanded} isActive={isActive(item.href)} />)}
          {visibleEcosystem.length > 0 && !isCompanyMode && <SectionLabel label="Ecosystem" expanded={expanded} />}
          {visibleEcosystem.map(item => <DesktopNavItem key={item.href} item={item} expanded={expanded} isActive={isActive(item.href)} />)}
          {visibleSetup.length > 0 && !isCompanyMode && <SectionLabel label="Setup" expanded={expanded} />}
          {visibleSetup.map(item => <DesktopNavItem key={item.href} item={item} expanded={expanded} isActive={isActive(item.href)} />)}
        </nav>
        <div className="py-2 border-t border-blue-800">
          <button className={`flex items-center mx-2 py-2.5 rounded-lg w-[calc(100%-16px)] text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors ${expanded ? "gap-3 px-3" : "justify-center px-0"}`}>
            <LogOut size={18} className="shrink-0" />
            <span className={`text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${expanded ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0 pointer-events-none"}`}>Logout</span>
          </button>
        </div>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-blue-900 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-blue-800">
              <div>
                <div className="text-white font-bold text-base leading-none truncate max-w-[180px]">{topTitle}</div>
                <div className="text-xs text-blue-300 mt-0.5">{topSubtitle}</div>
              </div>
              <button onClick={() => setMobileOpen(false)} className="p-1.5 text-blue-300 hover:text-white rounded-md hover:bg-blue-800 transition-colors">
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
              {visibleMain.map(item => <MobileNavItem key={item.href} item={item} isActive={isActive(item.href)} onClick={() => setMobileOpen(false)} />)}
              {visibleMaster.length > 0 && !isCompanyMode && <MobileSectionLabel label="Master Data" />}
              {visibleMaster.map(item => <MobileNavItem key={item.href} item={item} isActive={isActive(item.href)} onClick={() => setMobileOpen(false)} />)}
              {visibleEcosystem.length > 0 && !isCompanyMode && <MobileSectionLabel label="Ecosystem" />}
              {visibleEcosystem.map(item => <MobileNavItem key={item.href} item={item} isActive={isActive(item.href)} onClick={() => setMobileOpen(false)} />)}
              {visibleSetup.length > 0 && !isCompanyMode && <MobileSectionLabel label="Setup" />}
              {visibleSetup.map(item => <MobileNavItem key={item.href} item={item} isActive={isActive(item.href)} onClick={() => setMobileOpen(false)} />)}
            </nav>
            <div className="py-3 border-t border-blue-800">
              <button onClick={() => setMobileOpen(false)} className="flex items-center gap-3 mx-2 px-4 py-3 rounded-lg w-[calc(100%-16px)] text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors">
                <LogOut size={18} className="shrink-0" />
                <span className="text-sm font-medium">Logout</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
