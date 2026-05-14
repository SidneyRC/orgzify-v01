"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import NavUserDropdown from "@/components/shared/OREV1-027-NavUserDropdown";
import NavMobile from "@/components/shared/OREV1-028-NavMobile";

const MOCK_USER = {
  name: "Sidney", email: "sidney@example.com", avatar: null as string | null,
  academies: [
    { id: "a1", name: "Champions Academy", slug: "champions-academy-chennai-600001", status: "active" },
    { id: "a2", name: "Little Stars", slug: "little-stars-chennai-600002", status: "pending" },
  ],
  organisations: [
    { id: "o1", name: "Sidney Events Co.", slug: "sidney-events-co-chennai-600001", status: "active" },
  ],
};

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const router = useRouter();
  const user = MOCK_USER;

  const handleHostEvent = () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    const activeOrgs = user.organisations.filter(o => o.status === "active");
    if (activeOrgs.length === 1) router.push(`/organiser/${activeOrgs[0].slug}/dashboard`);
    else router.push("/organiser/select");
  };

  const handleLogout = () => { setIsLoggedIn(false); router.push("/"); };

  return (
    <>
      {/* ── SECTION 1 — Main Navbar ── */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
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
            <input type="text" placeholder="Search events, categories, cities..."
              className="flex-1 text-sm text-gray-700 focus:outline-none bg-transparent" />
          </div>

          {/* Right Side */}
          <div className="flex items-center gap-2 shrink-0">
            <select className="hidden md:block border border-gray-200 rounded-full px-3 py-2 text-sm text-gray-600 focus:outline-none cursor-pointer bg-white">
              <option value="all">📍 All Cities</option>
              <option value="chennai">Chennai</option>
              <option value="bangalore">Bangalore</option>
              <option value="mumbai">Mumbai</option>
            </select>

<button onClick={handleHostEvent} className="hidden md:block text-blue-900 border border-blue-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-50 transition">
  Host Event
</button>

            <button onClick={() => router.push(isLoggedIn ? "/register/type" : "/login?next=/register/type")}
              className="bg-blue-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-800 transition">
              Get Started
            </button>

            {!isLoggedIn ? (
              <a href="/login" className="text-blue-900 border border-blue-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-50 transition">
                Login
              </a>
            ) : (
              <NavUserDropdown user={user} onLogout={handleLogout} />
            )}

            <div className="md:hidden">
              <NavMobile isLoggedIn={isLoggedIn} userName={user.name} onHostEvent={handleHostEvent} />
            </div>
          </div>
        </div>
      </header>

      {/* ── SECTION 2 — Simulation. For Testing Only. Remove in Production. ── */}
      <div className="bg-gray-50 border-b border-dashed border-gray-300 px-6 py-2 flex items-center gap-3">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest">Simulation — For Testing Only. Remove in Production.</p>
        <button onClick={() => setIsLoggedIn(true)} className="px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-semibold hover:bg-green-700 transition">Simulate Logged In</button>
        <button onClick={() => setIsLoggedIn(false)} className="px-3 py-1 rounded-lg bg-red-500 text-white text-xs font-semibold hover:bg-red-600 transition">Simulate Logged Out</button>
        <p className="text-xs text-gray-400 italic">DB Connection Pending — remove when connected</p>
      </div>
    </>
  );
}
