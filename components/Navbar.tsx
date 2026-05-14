"use client";
import { useState, useRef, useEffect } from "react";

// ── Simulation — remove when auth is connected ──
const MOCK_USER = {
  name: "Sidney",
  email: "sidney@example.com",
  avatar: null as string | null,
  academies: [
    { id: "a1", name: "Champions Academy", status: "active" },
    { id: "a2", name: "Little Stars", status: "pending" },
  ],
  organisations: [
    { id: "o1", name: "Sidney Events Co.", status: "active" },
  ],
};

const STATUS_BADGE: Record<string, string> = {
  active:   "bg-green-100 text-green-700",
  pending:  "bg-yellow-100 text-yellow-700",
  draft:    "bg-gray-100 text-gray-500",
  rejected: "bg-red-100 text-red-600",
};

const STATUS_LABEL: Record<string, string> = {
  active:   "Active",
  pending:  "Pending",
  draft:    "Draft",
  rejected: "Rejected",
};

export default function Navbar() {
  // ── Simulation toggle — remove when auth is connected ──
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const user = MOCK_USER;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      window.location.href = "/register/type";
    } else {
      window.location.href = "/login?next=/register/type";
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setDropdownOpen(false);
    window.location.href = "/";
  };

  return (
    <>
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">

        {/* ── Main Navbar Row ── */}
        <div className="flex items-center justify-between px-6 py-3 gap-4">

          {/* Logo */}
          <a href="/" className="text-2xl font-bold text-blue-900 shrink-0">
            Orgz<span className="text-yellow-400">ify</span>
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-6 shrink-0 ml-6">
            <a href="/events" className="text-sm font-semibold text-gray-700 hover:text-blue-900 transition">Events</a>
            <a href="#features" className="text-sm font-semibold text-gray-700 hover:text-blue-900 transition">Features</a>
          </nav>

          {/* Search Bar */}
          <div className="hidden md:flex flex-1 border border-gray-200 rounded-full px-4 py-2 gap-2 hover:border-blue-400 transition">
            <span className="text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search events, categories, cities..."
              className="flex-1 text-sm text-gray-700 focus:outline-none bg-transparent"
            />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 shrink-0">

            {/* City Selector */}
            <select className="hidden md:block border border-gray-200 rounded-full px-3 py-2 text-sm text-gray-600 focus:outline-none cursor-pointer bg-white">
              <option value="all">📍 All Cities</option>
              <option value="chennai">Chennai</option>
              <option value="madurai">Madurai</option>
              <option value="coimbatore">Coimbatore</option>
              <option value="bangalore">Bangalore</option>
              <option value="mumbai">Mumbai</option>
            </select>

            {/* Get Started — always visible */}
            <button
              onClick={handleGetStarted}
              className="bg-blue-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-800 transition"
            >
              Get Started
            </button>

            {!isLoggedIn ? (
              /* Logged Out — Login button */
              <a
                href="/login"
                className="text-blue-900 border border-blue-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-50 transition"
              >
                Login
              </a>
            ) : (
              /* Logged In — Bell + Profile Dropdown */
              <div className="flex items-center gap-2">

                {/* Notification Bell */}
                <button className="relative p-2 rounded-full hover:bg-gray-100 transition">
                  <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                  {/* Unread dot */}
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
                </button>

                {/* Profile Dropdown */}
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:bg-gray-50 transition"
                  >
                    {/* Avatar */}
                    {user.avatar ? (
                      <img src={user.avatar} alt={user.name} className="w-7 h-7 rounded-full object-cover" />
                    ) : (
                      <div className="w-7 h-7 rounded-full bg-blue-900 flex items-center justify-center text-white text-xs font-bold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="text-sm font-semibold text-gray-800 hidden md:block">
                      Hi, {user.name.split(" ")[0]}
                    </span>
                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-lg border border-gray-100 py-2 z-50 animate-fade-in">

                      {/* User Info */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <p className="text-sm font-bold text-gray-800">{user.name}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{user.email}</p>
                      </div>

                      {/* Profile */}
                      <a href="/profile" onClick={() => setDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </a>

                      {/* Academy Section */}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Academy</p>
                        {user.academies.map((a) => (
                          <a key={a.id} href={`/academy/${a.id}`} onClick={() => setDropdownOpen(false)}
                            className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <span className="truncate">{a.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${STATUS_BADGE[a.status]}`}>
                              {STATUS_LABEL[a.status]}
                            </span>
                          </a>
                        ))}
                        <a href="/academy/register" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-900 font-semibold hover:bg-blue-50 transition">
                          <span className="text-lg leading-none">+</span> Register
                        </a>
                      </div>

                      {/* Organiser Section */}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 uppercase tracking-widest">Organiser</p>
                        {user.organisations.map((o) => (
                          <a key={o.id} href={`/organiser/${o.id}`} onClick={() => setDropdownOpen(false)}
                            className="flex items-center justify-between px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition">
                            <span className="truncate">{o.name}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ml-2 shrink-0 ${STATUS_BADGE[o.status]}`}>
                              {STATUS_LABEL[o.status]}
                            </span>
                          </a>
                        ))}
                        <a href="/organiser/register" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-2 px-4 py-2 text-sm text-blue-900 font-semibold hover:bg-blue-50 transition">
                          <span className="text-lg leading-none">+</span> Register
                        </a>
                      </div>

                      {/* Change Password + Logout */}
                      <div className="border-t border-gray-100 mt-1 pt-1">
                        <a href="/change-password" onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                          Change Password
                        </a>
                        <button onClick={handleLogout}
                          className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                          Logout
                        </button>
                      </div>

                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

      </header>

      {/* ── Section 2 — Simulation (DELETE ENTIRELY WHEN AUTH IS CONNECTED) ── */}
      <div className="bg-gray-50 border-b border-dashed border-gray-300 px-6 py-2 flex items-center gap-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">
          Simulation — For Testing Only. Remove in Production.
        </p>
        <button
          onClick={() => setIsLoggedIn(true)}
          className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition"
        >
          Simulate Logged In
        </button>
        <button
          onClick={() => setIsLoggedIn(false)}
          className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition"
        >
          Simulate Logged Out
        </button>
        <p className="text-xs text-gray-400 italic">DB Connection Pending — remove when connected</p>
      </div>
    </>
  );
}
