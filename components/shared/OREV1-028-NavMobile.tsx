"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import BusinessProfileList, { Company, Entity } from "@/components/shared/OREV1-073-BusinessProfileList";

interface Props {
  isLoggedIn: boolean;
  userName?: string;
  onHostEvent: () => void;
  companies?: Company[];
  entities?: Entity[];
  isSuperAdmin?: boolean;
}

function NavItem({ href, label, icon, onClick, danger = false }: { href: string; label: string; icon: string; onClick?: () => void; danger?: boolean }) {
  return (
    <Link href={href} onClick={onClick}
      className={`flex items-center gap-3 px-5 py-4 text-sm transition ${danger ? "text-red-500 hover:bg-red-50" : "text-gray-700 hover:bg-blue-50 hover:text-blue-900"}`}>
      <span className="text-base w-5 text-center">{icon}</span>
      {label}
    </Link>
  );
}

export default function NavMobile({ isLoggedIn, userName, onHostEvent, companies, entities, isSuperAdmin }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const goBusiness = (path: string) => { setMenuOpen(false); router.push(path); };

  return (
    <>
      {/* Hamburger Button */}
      <button onClick={() => setMenuOpen(true)} className="flex flex-col gap-1 p-1" aria-label="Open menu">
        <span className="w-5 h-0.5 bg-blue-900 block" />
        <span className="w-5 h-0.5 bg-blue-900 block" />
        <span className="w-5 h-0.5 bg-blue-900 block" />
      </button>

      {/* Slide-in Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setMenuOpen(false)} />

          <div className="w-72 bg-white h-full shadow-2xl flex flex-col overflow-y-auto">

            {/* Drawer Header */}
            <div className="bg-blue-900 px-5 py-4 flex items-center justify-between">
              <span className="text-xl font-bold text-white">Orgz<span className="text-yellow-400">ify</span></span>
              <button onClick={() => setMenuOpen(false)} className="text-white text-2xl leading-none">×</button>
            </div>

            {/* Logged In — User Info */}
            {isLoggedIn && (
              <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm font-bold">
                  {userName?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hi,</p>
                  <p className="font-semibold text-blue-900 text-sm">{userName}</p>
                </div>
              </div>
            )}

            {/* Search */}
            <div className="px-4 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-full px-4 py-2">
                <span className="text-gray-400 text-sm">🔍</span>
                <input type="text" placeholder="Search events..." className="flex-1 text-sm text-gray-700 outline-none bg-transparent" />
              </div>
            </div>

            {/* Nav Links */}
            <nav className="flex flex-col divide-y divide-gray-100 flex-1">
              {isLoggedIn ? (
                <>
                  <NavItem href="/profile/edit" label="My Profile" icon="👤" onClick={() => setMenuOpen(false)} />
                  <NavItem href="/profiles" label="Manage Profiles" icon="👥" onClick={() => setMenuOpen(false)} />
                  <NavItem href="/bookings" label="My Bookings" icon="📅" onClick={() => setMenuOpen(false)} />
                  <button onClick={() => { setMenuOpen(false); onHostEvent(); }}
                    className="flex items-center gap-3 px-5 py-4 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition">
                    <span className="text-base w-5 text-center">🎯</span> Host Event
                  </button>
                  <BusinessProfileList
                    companies={companies ?? []}
                    entities={entities ?? []}
                    isSuperAdmin={isSuperAdmin ?? false}
                    onNavigate={goBusiness}
                  />
                  <NavItem href="/events" label="Browse Events" icon="🏆" onClick={() => setMenuOpen(false)} />
                  <NavItem href="/auth/change-password" label="Change Password" icon="🔐" onClick={() => setMenuOpen(false)} />
                  <NavItem href="/" label="Logout" icon="🚪" onClick={() => setMenuOpen(false)} danger />
                </>
              ) : (
                <>
                  <NavItem href="/events" label="Browse Events" icon="🏆" onClick={() => setMenuOpen(false)} />
                  <NavItem href="#features" label="Features" icon="✨" onClick={() => setMenuOpen(false)} />
                  <button onClick={() => { setMenuOpen(false); onHostEvent(); }}
                    className="flex items-center gap-3 px-5 py-4 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-900 transition">
                    <span className="text-base w-5 text-center">🎯</span> Host Event
                  </button>
                  <NavItem href="/login" label="Login" icon="🔑" onClick={() => setMenuOpen(false)} />
                </>
              )}
            </nav>

            {/* Get Started CTA */}
            {!isLoggedIn && (
              <div className="p-5 border-t border-gray-100">
                <Link href="/register" onClick={() => setMenuOpen(false)}
                  className="block w-full bg-yellow-400 text-blue-900 text-center font-bold py-3 rounded-full hover:bg-yellow-300 transition text-sm">
                  🚀 Get Started Free
                </Link>
              </div>
            )}

          </div>
        </div>
      )}
    </>
  );
}
