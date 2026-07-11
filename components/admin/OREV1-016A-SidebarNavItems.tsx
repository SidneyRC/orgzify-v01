"use client";

import Link from "next/link";

type NavItem = { icon: any; label: string; href: string };

export function DesktopNavItem({ item, expanded, isActive }: { item: NavItem; expanded: boolean; isActive: boolean }) {
  return (
    <Link
      href={item.href}
      title={!expanded ? item.label : undefined}
      className={`flex items-center mx-2 py-2.5 rounded-lg transition-all duration-200 ${
        expanded ? "gap-3 px-3" : "justify-center px-0"
      } ${isActive ? "bg-yellow-400 text-blue-900" : "text-blue-200 hover:bg-blue-800 hover:text-white"}`}
    >
      <item.icon size={18} className="shrink-0" />
      <span className={`text-xs font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ${
        expanded ? "opacity-100 max-w-[160px]" : "opacity-0 max-w-0 pointer-events-none"
      }`}>
        {item.label}
      </span>
    </Link>
  );
}

export function SectionLabel({ label, expanded }: { label: string; expanded: boolean }) {
  return (
    <div className={`transition-all duration-300 overflow-hidden ${expanded ? "opacity-100 max-h-8 px-4 mb-1 mt-3" : "opacity-0 max-h-0"}`}>
      <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}

export function MobileNavItem({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 mx-2 px-4 py-3 rounded-lg transition-colors ${
        isActive ? "bg-yellow-400 text-blue-900" : "text-blue-200 hover:bg-blue-800 hover:text-white"
      }`}
    >
      <item.icon size={18} className="shrink-0" />
      <span className="text-sm font-medium">{item.label}</span>
    </Link>
  );
}

export function MobileSectionLabel({ label }: { label: string }) {
  return (
    <div className="px-6 pt-3 pb-1">
      <span className="text-[10px] font-semibold text-blue-400 uppercase tracking-widest">{label}</span>
    </div>
  );
}
