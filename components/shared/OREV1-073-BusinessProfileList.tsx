"use client";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-600",
  draft: "bg-gray-100 text-gray-500",
  rejected: "bg-red-100 text-red-600",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Active", pending: "Pending", suspended: "Suspended", draft: "Draft", rejected: "Rejected",
};

export interface Company { id: string; display_name: string; slug: string; company_status: string; logo_url?: string }
export interface Entity { id: string; process_id: string; display_name: string; status: string }

// Cosmetic-only URL slug from the entity's name — never used to look anything up.
// Real access is always cookie-driven, so this is safe to regenerate on the fly.
const slugify = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

export default function BusinessProfileList({
  companies, entities, isSuperAdmin, onNavigate,
}: {
  companies: Company[];
  entities: Entity[];
  isSuperAdmin: boolean;
  onNavigate: (path: string) => void;
}) {
  const handleCompanyClick = (c: Company) => {
    fetch('/company/select', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ company_id: c.id }),
    }).finally(() => onNavigate(`/company/${c.slug}/dashboard`));
  };

  const handleAdminClick = () => {
    fetch('/company/clear', { method: 'POST' }).finally(() => onNavigate('/admin'));
  };

  const handleEntityClick = (e: Entity) => {
    fetch('/entity/select', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ entity_id: e.id }),
    }).finally(() => onNavigate(`/biz/${slugify(e.display_name)}/dashboard`));
  };

  return (
    <>
      {/* Company — no Add here, internal Orgzify companies only */}
      <div className="border-t border-gray-100 mt-1 pt-1">
        <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Company</p>

        {isSuperAdmin && (
          <button onClick={handleAdminClick}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition text-left">
            <div className="w-6 h-6 rounded bg-blue-900 flex items-center justify-center shrink-0">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <span className="truncate">Admin Panel</span>
          </button>
        )}

        {companies.map(c => (
          <button key={c.id} onClick={() => handleCompanyClick(c)}
            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition text-left">
            <div className="flex items-center gap-2 min-w-0">
              {c.logo_url ? (
                <img src={c.logo_url} alt={c.display_name} className="w-6 h-6 rounded object-cover shrink-0" />
              ) : (
                <div className="w-6 h-6 rounded bg-blue-900 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                  {c.display_name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="truncate">{c.display_name}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${STATUS_BADGE[c.company_status] ?? "bg-gray-100 text-gray-500"}`}>
              {STATUS_LABEL[c.company_status] ?? c.company_status}
            </span>
          </button>
        ))}
      </div>

      {/* Business Profile — Entities, +Add opens Entity Registration */}
      <div className="border-t border-gray-100 mt-1 pt-1">
        <div className="flex items-center justify-between px-4 py-1.5">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Business Profile</p>
          <button onClick={() => onNavigate("/biz/register")}
            className="text-xs font-semibold text-blue-900 hover:underline">+ Add</button>
        </div>

        {entities.map(e => (
          <button key={e.id} onClick={() => handleEntityClick(e)}
            className="w-full flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition text-left">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded bg-blue-900 flex items-center justify-center text-white text-[9px] font-bold shrink-0">
                {e.display_name.charAt(0).toUpperCase()}
              </div>
              <span className="truncate">{e.display_name}</span>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${STATUS_BADGE[e.status] ?? "bg-gray-100 text-gray-500"}`}>
              {STATUS_LABEL[e.status] ?? e.status}
            </span>
          </button>
        ))}
      </div>
    </>
  );
}
