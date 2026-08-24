// components/shared/OREV1-028-NavMobile.tsx
"use client";
import { useState, type ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BusinessProfileList, { Company, Entity } from "@/components/shared/OREV1-073-BusinessProfileList";
import CityTrigger from "@/components/shared/OREV1-139B-CityTrigger";
import type { Theme } from "@/lib/ThemeContext";

interface Props {
  theme?: Theme | null;
  isLoggedIn: boolean;
  userName?: string;
  onHostEvent: () => void;
  companies?: Company[];
  entities?: Entity[];
  isSuperAdmin?: boolean;
}

const ICONS: Record<string, ReactElement> = {
  search: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />,
  profile: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />,
  people: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20H4v-2a4 4 0 013-3.87m5-4a4 4 0 100-8 4 4 0 000 8z" />,
  calendar: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  target: <><circle cx="12" cy="12" r="8" strokeWidth={2} /><circle cx="12" cy="12" r="3" strokeWidth={2} /></>,
  trophy: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 21h8m-4-4v4M6 3h12l-1 8a5 5 0 01-10 0L6 3z" />,
  lock: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />,
  logout: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
  key: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a4 4 0 11-4.9 4.9L5 17v2h2l1-1h2v-2h2l1.1-1.1A4 4 0 0015 7z" />,
  sparkle: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v4m0 10v4m9-9h-4M7 12H3m14.5-6.5l-2.8 2.8M9.3 14.7l-2.8 2.8m11-2.8l-2.8-2.8M9.3 9.3L6.5 6.5" />,
  rocket: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2c2 2 3 5 3 8 0 3-1 6-3 8-2-2-3-5-3-8 0-3 1-6 3-8zM8 16l-3 3M16 16l3 3" />,
};

function Icon({ name, color }: { name: string; color?: string }) {
  return (
    <svg style={{ color }} className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      {ICONS[name]}
    </svg>
  );
}

function NavItem({ href, label, icon, color, onClick, danger = false }: { href: string; label: string; icon: string; color?: string; onClick?: () => void; danger?: boolean }) {
  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 px-5 py-4 text-sm transition ${danger ? "text-red-500 hover:bg-red-50" : "text-gray-700 hover:bg-gray-50"}`}>
      <Icon name={icon} color={danger ? undefined : color} />
      {label}
    </Link>
  );
}

export default function NavMobile({ theme, isLoggedIn, userName, onHostEvent, companies, entities, isSuperAdmin }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const goBusiness = (path: string) => { setMenuOpen(false); router.push(path); };

  const mobileHeaderBg = theme?.mobile_header_bg || '#ffffff';
  const linkColor = theme?.link_color || '#1e3a8a';
  const avatarBg = theme?.avatar_bg || '#1e3a8a';
  const avatarText = theme?.avatar_text || '#ffffff';
  const filledStyle = { backgroundColor: theme?.btn_bg || '#facc15', color: theme?.btn_text || '#1e3a8a' };

  const handleGetStarted = () => {
    setMenuOpen(false);
    const dest = "/biz/register";
    router.push(isLoggedIn ? dest : `/login?next=${encodeURIComponent(dest)}`);
  };

  return (
    <>
      <button onClick={() => setMenuOpen(true)} className="flex flex-col gap-1 p-1" aria-label="Open menu">
        <span className="w-5 h-0.5 block" style={{ backgroundColor: linkColor }} />
        <span className="w-5 h-0.5 block" style={{ backgroundColor: linkColor }} />
        <span className="w-5 h-0.5 block" style={{ backgroundColor: linkColor }} />
      </button>

      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setMenuOpen(false)} />
          <div className="w-72 bg-white h-full shadow-2xl flex flex-col overflow-y-auto">

                        <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100" style={{ backgroundColor: mobileHeaderBg }}>
              <span className="text-xl font-bold whitespace-nowrap"><span style={{ color: linkColor }}>Orgz</span><span className="text-yellow-400">ify</span></span>
              <button onClick={() => setMenuOpen(false)} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">×</button>
            </div>

            {isLoggedIn && (
              <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold" style={{ backgroundColor: avatarBg, color: avatarText }}>
                    {userName?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Hi,</p>
                    <p className="font-semibold text-sm" style={{ color: linkColor }}>{userName}</p>
                  </div>
                </div>
                <CityTrigger theme={theme} alwaysVisible />
              </div>
            )}
            {!isLoggedIn && (
              <div className="px-4 py-3 border-b border-gray-100 flex justify-end">
                <CityTrigger theme={theme} alwaysVisible />
              </div>
            )}

            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
                <Icon name="search" color="#9ca3af" />
                <input type="text" placeholder="Search events..." className="flex-1 text-sm text-gray-700 outline-none bg-transparent" />
              </div>
            </div>

            <nav className="flex flex-col divide-y divide-gray-100 flex-1">
              {isLoggedIn ? (
                <>
                  <NavItem href="/profile/edit" label="My Profile" icon="profile" color={linkColor} onClick={() => setMenuOpen(false)} />
                  <NavItem href="/profiles" label="Manage Profiles" icon="people" color={linkColor} onClick={() => setMenuOpen(false)} />
                  <NavItem href="/bookings" label="My Bookings" icon="calendar" color={linkColor} onClick={() => setMenuOpen(false)} />
                                    <button onClick={() => { setMenuOpen(false); onHostEvent(); }}
                    className="flex items-center gap-3 px-5 py-4 text-sm text-gray-700 hover:bg-gray-50 transition">
                    <Icon name="target" color={linkColor} /> Host Event
                  </button>
                  <button onClick={handleGetStarted} style={filledStyle}
                    className="flex items-center gap-2 mx-5 my-2 px-4 py-2.5 rounded-full font-bold text-sm hover:opacity-90 transition">
                    <Icon name="rocket" /> Get Started Free
                  </button>
                  <BusinessProfileList companies={companies ?? []} entities={entities ?? []} isSuperAdmin={isSuperAdmin ?? false} onNavigate={goBusiness} />
                  <NavItem href="/events" label="Browse Events" icon="trophy" color={linkColor} onClick={() => setMenuOpen(false)} />
                  <NavItem href="/auth/change-password" label="Change Password" icon="lock" color={linkColor} onClick={() => setMenuOpen(false)} />
                  <NavItem href="/" label="Logout" icon="logout" onClick={() => setMenuOpen(false)} danger />
                </>
              ) : (
                <>
                  <NavItem href="/events" label="Browse Events" icon="trophy" color={linkColor} onClick={() => setMenuOpen(false)} />
                  <NavItem href="#features" label="Features" icon="sparkle" color={linkColor} onClick={() => setMenuOpen(false)} />
                  <button onClick={() => { setMenuOpen(false); onHostEvent(); }}
                    className="flex items-center gap-3 px-5 py-4 text-sm text-gray-700 hover:bg-gray-50 transition">
                    <Icon name="target" color={linkColor} /> Host Event
                  </button>
                  <NavItem href="/login" label="Login" icon="key" color={linkColor} onClick={() => setMenuOpen(false)} />
                </>
              )}
            </nav>

                        </div>
        </div>
      )}
    </>
  );
}