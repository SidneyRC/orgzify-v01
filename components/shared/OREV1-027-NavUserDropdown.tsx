"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import BellDropdown from "@/components/shared/OREV1-018-BellDropdown";
import BusinessProfileList, { Company, Entity } from "@/components/shared/OREV1-073-BusinessProfileList";

interface User {
  name: string; email?: string; avatar?: string | null;
  is_super_admin: boolean;
  companies: Company[];
  entities?: Entity[];
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

  // Companies/Entities shown start as whatever the page already loaded,
  // but get refreshed fresh every time the dropdown is opened — so status
  // changes made elsewhere (e.g. Admin approving/rejecting) show up
  // immediately next time this is opened, instead of needing a full
  // page reload.
  const [liveCompanies, setLiveCompanies] = useState<Company[]>(user.companies);
  const [liveEntities, setLiveEntities] = useState<Entity[]>(user.entities ?? []);

  useEffect(() => {
    if (!dropdownOpen) return;
    fetch('/profile/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const p = data?.profile ?? data;
        if (!p) return;
        setLiveCompanies(p.companies ?? []);
        setLiveEntities(p.entities ?? []);
      })
      .catch(() => {});
  }, [dropdownOpen]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setDropdownOpen(false);
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const go = (path: string) => { setDropdownOpen(false); router.push(path); };

  // Company/Entity clicks also notify the parent (for cookie-context UI updates)
  // before navigating, so onCompanySelect still fires alongside the shared list's own logic.
  const handleBusinessNavigate = (path: string) => {
    setDropdownOpen(false);
    if (onCompanySelect && path === '/admin') onCompanySelect('', '');
    router.push(path);
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
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50 max-h-[75vh] overflow-y-auto">

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

            {/* Company + Business Profile — shared with mobile drawer */}
            <BusinessProfileList
              companies={liveCompanies}
              entities={liveEntities}
              isSuperAdmin={user.is_super_admin}
              onNavigate={handleBusinessNavigate}
            />

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
