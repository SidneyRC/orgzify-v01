// THIS FILE GOES IN: components/shared/OREV1-074-EntityDashboardHero.tsx (NEW FILE)
"use client";
import { Theme } from "@/lib/ThemeContext";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700", pending: "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-600", rejected: "bg-red-100 text-red-600",
};

export default function EntityDashboardHero({ entityName, status, theme, radius }: {
  entityName: string; status: string; theme: Theme | null; radius: string;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-6 mb-6 text-white"
      style={{
        borderRadius: radius,
        boxShadow: theme?.card_shadow || "0 1px 3px rgba(0,0,0,0.06)",
        background: `linear-gradient(135deg, ${theme?.carousel_from || "#2563eb"}, ${theme?.carousel_to || "#1e3a5f"})`,
      }}>
      <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-lg font-bold shrink-0">
        {entityName?.charAt(0).toUpperCase()}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold truncate">Welcome back, {entityName}</p>
        <p className="text-xs text-white/70">Your Business Profile dashboard</p>
      </div>
      <span className={`text-xs px-3 py-1 rounded-full font-medium shrink-0 ${STATUS_BADGE[status] ?? "bg-white/20"}`}>
        {status}
      </span>
    </div>
  );
}
