"use client";

import { useState } from "react";
import Link from "next/link";


interface User { name: string; initials: string; }

export default function MobileNavbar({ user = null }: { user?: User | null }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const initials = user?.initials || "";

  return (
    <>
      {/* Top Bar — Logo | Login | Hamburger */}
      <header className="bg-blue-900 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link href="/" className="text-xl font-bold text-white tracking-tight">
          Orgz<span className="text-yellow-400">ify</span>
        </Link>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="w-8 h-8 rounded-full bg-yellow-400 text-blue-900 flex items-center justify-center text-xs font-bold">
              {initials}
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-yellow-400 text-blue-900 text-xs font-bold px-4 py-1.5 rounded-full hover:bg-yellow-300 transition"
            >
              Login
            </Link>
          )}

          <button
            onClick={() => setMenuOpen(true)}
            className="flex flex-col gap-1 p-1"
            aria-label="Open menu"
          >
            <span className="w-5 h-0.5 bg-white block" />
            <span className="w-5 h-0.5 bg-white block" />
            <span className="w-5 h-0.5 bg-white block" />
          </button>
        </div>
      </header>

      {/* Search Bar */}
      <div className="bg-blue-50 px-4 py-2">
        <div className="flex items-center gap-2 bg-white border border-blue-200 rounded-full px-4 py-2">
          <span className="text-gray-400 text-sm">🔍</span>
          <input
            type="text"
            placeholder="Search events..."
            className="flex-1 text-sm text-gray-700 placeholder-gray-400 outline-none bg-transparent"
          />
        </div>
      </div>

      {/* Slide-in Drawer */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div className="flex-1 bg-black/40" onClick={() => setMenuOpen(false)} />

          <div className="w-72 bg-white h-full shadow-2xl flex flex-col overflow-y-auto">
            <div className="bg-blue-900 px-5 py-4 flex items-center justify-between">
              <span className="text-xl font-bold text-white">
                Orgz<span className="text-yellow-400">ify</span>
              </span>
              <button onClick={() => setMenuOpen(false)} className="text-white text-2xl leading-none">×</button>
            </div>

            {user && (
              <div className="px-5 py-4 bg-blue-50 border-b border-blue-100 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-900 text-white flex items-center justify-center text-sm font-bold">
                  {initials}
                </div>
                <div>
                  <p className="text-xs text-gray-500">Hi,</p>
                  <p className="font-semibold text-blue-900 text-sm">{user.name}</p>
                </div>
              </div>
            )}

            <nav className="flex flex-col divide-y divide-gray-100 flex-1">
              {user ? (
                <>
                  <NavItem href="/dashboard" label="Dashboard" icon="📊" onClick={() => setMenuOpen(false)} />
                  <NavItem href="/events/create" label="Create Event" icon="➕" onClick={() => setMenuOpen(false)} />
                  <NavItem href="/profile" label="My Profile" icon="👤" onClick={() => setMenuOpen(false)} />
                  <NavItem href="/settings" label="Settings" icon="⚙️" onClick={() => setMenuOpen(false)} />
                  <NavItem href="#features" label="Features" icon="✨" onClick={() => setMenuOpen(false)} />
                  <NavItem href="#how-it-works" label="How it Works" icon="🔄" onClick={() => setMenuOpen(false)} />
                  <NavItem href="#city" label="Events Near Me" icon="📍" onClick={() => setMenuOpen(false)} />
                  <NavItem href="/logout" label="Logout" icon="🚪" onClick={() => setMenuOpen(false)} danger />
                </>
              ) : (
                <>
                  <NavItem href="#features" label="Features" icon="✨" onClick={() => setMenuOpen(false)} />
                  <NavItem href="#how-it-works" label="How it Works" icon="🔄" onClick={() => setMenuOpen(false)} />
                  <NavItem href="#city" label="Events Near Me" icon="📍" onClick={() => setMenuOpen(false)} />
                  <NavItem href="/events" label="Browse Events" icon="🏆" onClick={() => setMenuOpen(false)} />
                  <NavItem href="/login" label="Login" icon="🔐" onClick={() => setMenuOpen(false)} />
                </>
              )}
            </nav>

            {!user && (
              <div className="p-5 border-t border-gray-100">
                <Link
                  href="/register"
                  onClick={() => setMenuOpen(false)}
                  className="block w-full bg-yellow-400 text-blue-900 text-center font-bold py-3 rounded-full hover:bg-yellow-300 transition text-sm"
                >
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

function NavItem({ href, label, icon, onClick, danger = false }: { href: string; label: string; icon: string; onClick?: () => void; danger?: boolean }) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`flex items-center gap-3 px-5 py-4 text-sm transition ${
        danger ? "text-red-500 hover:bg-red-50" : "text-gray-700 hover:bg-blue-50 hover:text-blue-900"
      }`}
    >
      <span className="text-base w-5 text-center">{icon}</span>
      {label}
    </Link>
  );
}