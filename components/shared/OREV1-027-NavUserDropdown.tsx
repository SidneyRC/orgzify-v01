"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTheme } from "@/lib/ThemeContext";
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
  const { theme } = useTheme();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const bellRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  const handleBusinessNavigate = (path: string) => {
    setDropdownOpen(false);
    if (onCompanySelect && path === '/admin') onCompanySelect('', '');
    router.push(path);
  };

  const avatarBg = theme?.avatar_bg || '#1e3a8a';
  const avatarText = theme?.avatar_text || '#ffffff';
  const dropdownBg = theme?.dropdown_bg || '#ffffff';
  const hoverBg = theme?.dropdown_hover_bg || '#f9fafb';
  const dividerColor = theme?.divider_color || '#f3f4f6';
  const inputBorder = theme?.input_border || '#e5e7eb';
  const textPrimary = theme?.color_text_primary || '#1f2937';
  const textSecondary = theme?.color_text_secondary || '#374151';
  const textMuted = theme?.color_text_muted || '#9ca3af';

  return (
    <div className="flex items-center gap-2">

      {/* Bell — stays neutral, not theme-driven (confirmed) */}
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
        <button onClick={() => setDropdownOpen(!dropdownOpen)} style={{ borderColor: inputBorder }}
          onMouseEnter={e => (e.currentTarget.style.backgroundColor = hoverBg)}
          onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
          className="flex items-center gap-2 px-3 py-1.5 rounded-full border transition">
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
          ) : (
            <div style={{ backgroundColor: avatarBg, color: avatarText }}
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold">
              {(user.name || "?").charAt(0).toUpperCase()}
            </div>
          )}
          <span style={{ color: textPrimary }} className="text-sm font-semibold hidden md:block">Hi, {(user.name || "").split(" ")[0]}</span>
          <svg style={{ color: textMuted }} className={`w-4 h-4 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {dropdownOpen && (
          <div style={{ backgroundColor: dropdownBg, borderColor: dividerColor }}
            className="absolute right-0 mt-2 w-64 rounded-2xl shadow-lg border py-2 z-50 max-h-[75vh] overflow-y-auto">

            {/* User Info */}
            <div style={{ borderColor: dividerColor }} className="px-4 py-3 border-b">
              <p style={{ color: textPrimary }} className="text-sm font-bold">{user.name}</p>
              <p style={{ color: textMuted }} className="text-xs mt-0.5">{user.email}</p>
            </div>

            {/* My Account */}
            {[
              { label: "My Profile",      href: "/profile/edit", icon: "M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" },
              { label: "Manage Profiles", href: "/profiles",     icon: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v2h5m0-2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0" },
              { label: "My Bookings",     href: "/bookings",     icon: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" },
            ].map(({ label, href, icon }) => (
              <button key={label} onClick={() => go(href)} style={{ color: textSecondary }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = hoverBg)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left">
                <svg style={{ color: textMuted }} className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
            <div style={{ borderColor: dividerColor }} className="border-t mt-1 pt-1">
              <button onClick={() => go("/auth/change-password")} style={{ color: textSecondary }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = hoverBg)}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '')}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm transition text-left">
                <svg style={{ color: textMuted }} className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                Change Password
              </button>
              {/* Logout — stays red, not theme-driven (confirmed) */}
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
