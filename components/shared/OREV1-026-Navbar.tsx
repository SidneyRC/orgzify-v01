"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavUserDropdown from "@/components/shared/OREV1-027-NavUserDropdown";
import NavMobile from "@/components/shared/OREV1-028-NavMobile";

type UserData = {
  zy_id: string;
  full_name: string;
  is_complete: boolean;
  academies: { id: string; name: string; slug: string; status: string }[];
  organisations: { id: string; name: string; slug: string; status: string }[];
} | null;

export default function Navbar() {
  const [user, setUser] = useState<UserData>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetch('/profile/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => { setUser(data); setLoading(false); })
      .catch(() => { setUser(null); setLoading(false); });
  }, []);

  const isLoggedIn = user !== null;

  const handleHostEvent = () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    const activeOrgs = user.organisations.filter(o => o.status === "active");
    if (activeOrgs.length === 1) router.push(`/organiser/${activeOrgs[0].slug}/dashboard`);
    else router.push("/organiser/select");
  };

  const handleLogout = async () => {
    await fetch('/logout', { method: 'POST' });
    setUser(null);
    router.push("/");
  };

  return (
    <header className="sticky top-0 z-50 bg-white border-b border-gray-100 shadow-sm">
      <div className="flex items-center justify-between px-6 py-3 gap-4">

        <a href="/" className="text-2xl font-bold text-blue-900 shrink-0">
          Orgz<span className="text-yellow-400">ify</span>
        </a>

        <nav className="hidden md:flex items-center gap-6 shrink-0 ml-6">
          <a href="/events" className="text-sm font-semibold text-gray-700 hover:text-blue-900 transition">Events</a>
          <a href="#features" className="text-sm font-semibold text-gray-700 hover:text-blue-900 transition">Features</a>
        </nav>

        <div className="hidden md:flex flex-1 border border-gray-200 rounded-full px-4 py-2 gap-2 hover:border-blue-400 transition">
          <span className="text-gray-400 text-sm">🔍</span>
          <input type="text" placeholder="Search events, categories, cities..."
            className="flex-1 text-sm text-gray-700 focus:outline-none bg-transparent" />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <select className="hidden md:block border border-gray-200 rounded-full px-3 py-2 text-sm text-gray-600 focus:outline-none cursor-pointer bg-white">
            <option value="all">📍 All Cities</option>
            <option value="chennai">Chennai</option>
            <option value="bangalore">Bangalore</option>
            <option value="mumbai">Mumbai</option>
          </select>

          <button onClick={handleHostEvent}
            className="hidden md:block text-blue-900 border border-blue-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-50 transition">
            Host Event
          </button>

          <button onClick={() => router.push(isLoggedIn ? "/register/type" : "/login?next=/register/type")}
            className="bg-blue-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-800 transition">
            Get Started
          </button>

          {loading ? (
            <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
          ) : !isLoggedIn ? (
            <a href="/login"
              className="text-blue-900 border border-blue-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-50 transition">
              Login
            </a>
          ) : (
            <NavUserDropdown user={{ name: user.full_name, ...user }} onLogout={handleLogout} />
          )}

          <div className="md:hidden">
            <NavMobile isLoggedIn={isLoggedIn} userName={user?.full_name || ''} onHostEvent={handleHostEvent} />
          </div>
        </div>
      </div>
    </header>
  );
}
