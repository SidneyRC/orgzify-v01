  "use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  GraduationCap,
  Building2,
  Settings,
  LogOut,
  ChevronRight,
  X,
} from "lucide-react";

const mainNav = [
  { icon: LayoutDashboard, label: "Dashboard",    href: "/admin" },
  { icon: Users,           label: "Users",         href: "/admin/users" },
  { icon: CalendarDays,    label: "Events",        href: "/admin/events" },
  { icon: GraduationCap,   label: "Academies",     href: "/admin/academies" },
  { icon: Building2,       label: "Organisations", href: "/admin/organisations" },
  { icon: Settings,        label: "System Setup",  href: "/admin/system-setup" },
];

interface Props {
  expanded: boolean;
  setExpanded: (v: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (v: boolean) => void;
}

export default function AdminSidebar({
  expanded,
  setExpanded,
  mobileOpen,
  setMobileOpen,
}: Props) {
  const pathname = usePathname();

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps

  const DesktopNavItem = ({ item }: { item: (typeof mainNav)[0] }) => {
    const isActive =
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname.startsWith(item.href);

    return (
      <Link
        href={item.href}
        title={!expanded ? item.label : undefined}
        className={`flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg transition-all duration-200 ${
          isActive
            ? "bg-yellow-400 text-blue-900"
            : "text-blue-200 hover:bg-blue-800 hover:text-white"
        }`}
      >
        <item.icon size={18} className="shrink-0" />
        <span
          className={`text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
            expanded ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0 pointer-events-none"
          }`}
        >
          {item.label}
        </span>
      </Link>
    );
  };

  const MobileNavItem = ({ item }: { item: (typeof mainNav)[0] }) => {
    const isActive =
      item.href === "/admin"
        ? pathname === "/admin"
        : pathname.startsWith(item.href);

    return (
      <Link
        href={item.href}
        onClick={() => setMobileOpen(false)}
        className={`flex items-center gap-3 mx-2 px-4 py-3 rounded-lg transition-colors ${
          isActive
            ? "bg-yellow-400 text-blue-900"
            : "text-blue-200 hover:bg-blue-800 hover:text-white"
        }`}
      >
        <item.icon size={18} className="shrink-0" />
        <span className="text-sm font-medium">{item.label}</span>
      </Link>
    );
  };

  return (
    <>
      {/* ── Desktop Sidebar ── */}
      <aside
        className={`hidden md:flex flex-col h-screen bg-blue-900 border-r border-blue-800 shrink-0 transition-all duration-300 ${
          expanded ? "w-52" : "w-14"
        }`}
      >
        {/* Header — brand appears when expanded */}
        <div className="flex items-center justify-between px-2 py-3 border-b border-blue-800 min-h-[56px]">
          <div
            className={`transition-all duration-300 overflow-hidden ${
              expanded ? "opacity-100 max-w-[160px] pl-1" : "opacity-0 max-w-0"
            }`}
          >
            <div className="text-white font-bold text-sm leading-none whitespace-nowrap">
              ORGZIFY
            </div>
            <div className="text-blue-300 text-[10px] mt-1 whitespace-nowrap">
              Super Admin
            </div>
          </div>

          <button
            onClick={() => setExpanded(!expanded)}
            title={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className="p-1.5 rounded-md text-blue-300 hover:text-white hover:bg-blue-800 transition-colors ml-auto"
          >
            <ChevronRight
              size={16}
              className={`transition-transform duration-300 ${
                expanded ? "rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Main nav */}
        <nav className="flex-1 py-3 space-y-0.5 overflow-hidden">
          {mainNav.map((item) => (
            <DesktopNavItem key={item.href} item={item} />
          ))}
        </nav>

        {/* Bottom — Logout */}
        <div className="py-2 border-t border-blue-800">
          <button
            onClick={() => { /* wire to signOut() when auth is ready */ }}
            title={!expanded ? "Logout" : undefined}
            className="flex items-center gap-3 mx-2 px-3 py-2.5 rounded-lg w-[calc(100%-16px)] text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
          >
            <LogOut size={18} className="shrink-0" />
            <span
              className={`text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
                expanded ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0 pointer-events-none"
              }`}
            >
              Logout
            </span>
          </button>
        </div>
      </aside>

      {/* ── Mobile Overlay ── */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-64 bg-blue-900 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-4 border-b border-blue-800">
              <div>
                <div className="text-white font-bold text-base leading-none">ORGZIFY</div>
                <div className="text-xs text-blue-300 mt-0.5">Super Admin</div>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                className="p-1.5 text-blue-300 hover:text-white rounded-md hover:bg-blue-800 transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <nav className="flex-1 py-4 space-y-0.5 overflow-y-auto">
              {mainNav.map((item) => (
                <MobileNavItem key={item.href} item={item} />
              ))}
            </nav>
            <div className="py-3 border-t border-blue-800">
              <button
                onClick={() => { setMobileOpen(false); /* wire to signOut() when auth is ready */ }}
                className="flex items-center gap-3 mx-2 px-4 py-3 rounded-lg w-[calc(100%-16px)] text-red-400 hover:bg-red-900/30 hover:text-red-300 transition-colors"
              >
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
