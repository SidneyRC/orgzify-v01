"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import BellDropdown from "@/components/shared/OREV1-018-BellDropdown";

const STATUS_BADGE: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  pending: "bg-yellow-100 text-yellow-700",
  suspended: "bg-red-100 text-red-600",
};
const STATUS_LABEL: Record<string, string> = {
  active: "Active", pending: "Pending", suspended: "Suspended",
};

interface Company { id: string; display_name: string; slug: string; company_status: string; logo_url?: string }
interface User {
  name: string; email?: string; avatar?: string | null;
  is_super_admin: boolean;
  companies: Company[];
}

export default function NavUserDropdown({
  user, onLogout, onCompanySelect,
}: {
  user: User;
  onLogout: () => void;
  onCompanySelect?: (company_id: string, slug: string) => void;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const go = (path: string) => { setDropdownOpen(false); router.push(path); };

  const handleCompanyClick = (c: Company) => {
    setDropdownOpen(false);
    if (onCompanySelect) onCompanySelect(c.id, c.slug);
    router.push(`/company/${c.slug}/dashboard`);
  };

  const handleAdminClick = () => {
    setDropdownOpen(false);
    // Clear active company context, then load default theme via shell, then navigate
    fetch('/company/clear', { method: 'POST' }).finally(() => {
      if (onCompanySelect) onCompanySelect('', '');
      router.push('/admin');
    });
  };

  return (
    <div className="flex items-center gap-2">

      {/* Bell */}
      <div className="relative" ref={bellRef}>
        <button onClick={() => setBellOpen(!bellOpen)}
          className="relative p-2 rounded-full hover:bg-gray-100 transition">
          <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </button>
        {bellOpen && <BellDropdown onClose={() => setBellOpen(false)} />}
      </div>

      {/* Avatar Dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div className="w-7 h-7 rounded-full bg-blue-900 flex items-center justify-center text-white text-xs font-bold">
              {(user.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-semibold text-gray-800 hidden md:block">Hi, {(user.name || "").split(" ")[0]}</span>
          <svg className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50">

            {/* User Info */}
            <div className="px-4 py-3 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-800">{user.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
            </div>

            {/* My Account */}
            {[
              { label: "My Profile",      href: "/profile/edit", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
              { label: "Manage Profiles", href: "/profiles",     icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v2h5m0-2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" },
              { label: "My Bookings",     href: "/bookings",     icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
            ].map(({ label, href, icon }) => (
              <button key={label} onClick={() => go(href)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
                </svg>
                {label}
              </button>
            ))}

            {/* Company */}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <div className="flex items-center justify-between px-4 py-1.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Company</p>
                <button onClick={() => go("/company/register")}
                  className="text-xs font-semibold text-blue-900 hover:underline">+ Add</button>
              </div>

              {user.is_super_admin && (
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

              {user.companies.map(c => (
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

            {/* Change Password + Logout */}
            <div className="border-t border-gray-100 mt-1 pt-1">
              <button onClick={() => go("/auth/change-password")}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition text-left">
                <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </button>
              <button onClick={() => { setDropdownOpen(false); onLogout(); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition text-left">
                <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Logout
              </button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
