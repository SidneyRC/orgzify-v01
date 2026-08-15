// GOES IN: app/(admin)/admin/setup/countries/OREV1-079-CountriesClient.tsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
import CountriesTable from "./OREV1-044A-CountriesTable";

const PAGE_SIZE = 20;

export default function OREV1079CountriesClient({ canSync }: { canSync: boolean }) {
  const router = useRouter();
  const { theme } = useTheme();
  const [all, setAll] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; msg: string } | null>(null);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [syncDue, setSyncDue] = useState(false);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(PAGE_SIZE);

  const radius = theme?.global_border_radius || "12px";
  const primaryBtn = { backgroundColor: theme?.btn_bg || "#1e3a8a", color: theme?.btn_text || "#fff", borderRadius: radius };
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || "#fff", color: theme?.btn_outline_text || "#4b5563", border: `1px solid ${theme?.btn_outline_border || "#e5e7eb"}`, borderRadius: radius };

  const showToast = (type: "success" | "error", msg: string) => { setToast({ type, msg }); setTimeout(() => setToast(null), 4000); };

  const loadCountries = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/admin/setup/countries/api");
    const data = await res.json();
    if (res.ok) { setAll(data.countries ?? []); setLastSync(data.lastSync ?? null); setSyncDue(data.syncDue ?? true); }
    else showToast("error", data.error || "Failed to load countries.");
    setLoading(false);
  }, []);

  useEffect(() => { loadCountries(); }, [loadCountries]);

  const handleSync = async () => {
    setSyncing(true);
    const res = await fetch("/admin/setup/countries/api", { method: "POST" });
    const data = await res.json();
    if (res.ok) { showToast("success", `Sync complete — ${data.inserted} new, ${data.updated} updated, ${data.skipped} unchanged.`); loadCountries(); }
    else showToast("error", data.error || "Sync failed.");
    setSyncing(false);
  };

  const runSearch = () => { setAppliedSearch(search); setPage(1); };
  const runReset = () => { setSearch(""); setAppliedSearch(""); setPage(1); };

  const q = appliedSearch.toLowerCase();
  const filtered = all.filter(c => c.name.toLowerCase().includes(q) || c.iso2.toLowerCase().includes(q) || c.region?.toLowerCase().includes(q) || c.capital?.toLowerCase().includes(q));
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const pageRows = filtered.slice((page - 1) * limit, (page - 1) * limit + limit);

  return (
    <div className="p-4 md:p-6">
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-5 py-3 rounded-xl shadow-md text-sm font-medium border ${toast.type === "success" ? "bg-green-50 text-green-800 border-green-200" : "bg-red-50 text-red-800 border-red-200"}`}>
          {toast.type === "success" ? "✓ " : "✕ "}{toast.msg}
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: theme?.color_text_primary || "#111827" }}>Countries</h1>
          <p className="text-xs mt-0.5" style={{ color: theme?.color_text_muted || "#9ca3af" }}>
            {lastSync ? `Last synced: ${lastSync}` : "Never synced"}{syncDue && <span className="ml-2 text-orange-600 font-medium">— Sync Due</span>}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/admin/table")} style={outlineBtn} className="flex-1 md:flex-none text-sm font-medium px-4 py-2">← Back</button>
          {canSync && (
            <button onClick={handleSync} disabled={syncing} style={primaryBtn} className="flex-1 md:flex-none text-sm font-medium px-4 py-2 disabled:opacity-60">{syncing ? "Syncing…" : "Sync Countries"}</button>
          )}
        </div>
      </div>

      <div className="flex gap-1.5 mb-5">
        <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === "Enter") runSearch(); }}
          placeholder="Search…" className="flex-1 min-w-0 border border-gray-200 rounded-xl px-3 py-2 text-xs md:text-sm focus:outline-none focus:border-blue-400" />
        <button onClick={runReset} style={outlineBtn} className="shrink-0 text-xs md:text-sm font-medium px-3 py-2">Reset</button>
        <button onClick={runSearch} style={primaryBtn} className="shrink-0 text-xs md:text-sm font-medium px-3 py-2">Search</button>
      </div>

      <div className="flex items-center gap-1 text-xs md:text-sm text-gray-500 mb-4">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">‹ Prev</button>
        <input type="number" min={1} max={totalPages} value={page} onChange={e => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))} className="w-12 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
        <span>of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">Next ›</button>
        <span className="text-gray-300">|</span>
        <input type="number" min={1} value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1); }} className="w-14 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
        <span className="text-gray-400">{total} total</span>
      </div>

      {loading ? (
        <p className="text-sm text-gray-400 text-center py-10">Loading…</p>
      ) : pageRows.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-400 text-sm">No countries found.</p>
          <p className="text-gray-400 text-xs mt-1">{canSync ? "Click Sync Countries to load data." : "Ask an admin to run a sync."}</p>
        </div>
      ) : (
        <CountriesTable rows={pageRows} theme={theme} />
      )}
    </div>
  );
}
