"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import NavUserDropdown from "@/components/shared/OREV1-027-NavUserDropdown";
import NavMobile from "@/components/shared/OREV1-028-NavMobile";

type UserData = {
  zy_id: string;
  full_name: string;
  is_complete: boolean;
  is_super_admin: boolean;
  companies: { id: string; display_name: string; slug: string; company_status: string }[];
} | null;

export default function NavUserSection({ initialName, initialAvatar }: { initialName: string; initialAvatar: string }) {
  const [user, setUser] = useState<UserData>(null);
  const [displayName, setDisplayName] = useState<string>(initialName);
  const [displayAvatar, setDisplayAvatar] = useState<string>(initialAvatar);
  const [ready, setReady] = useState<boolean>(false);
  const router = useRouter();

  useEffect(() => {
    fetch('/profile/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        // /profile/me returns { profile: {...} }
        const p = data?.profile ?? data;
        if (p) {
          setUser({
            zy_id: p.zy_id ?? '',
            full_name: p.full_name ?? '',
            is_complete: p.is_complete ?? true,
            is_super_admin: p.is_super_admin ?? false,
            companies: p.companies ?? [],
            });
          // full_name includes title e.g. "Mr. Sidney" — take first non-title word
          if (p.full_name) {
            const parts = p.full_name.split(' ');
            setDisplayName(parts.find((w: string) => !w.endsWith('.')) ?? parts[0] ?? '');
          }
          if (p.photo_url) setDisplayAvatar(p.photo_url);
        }
        setReady(true);
      })
      .catch(() => { setUser(null); setReady(true); });
  }, []);

  const isLoggedIn = displayName !== '';

  const handleHostEvent = () => {
    if (!isLoggedIn) { router.push("/login"); return; }
    const activeCompanies = user?.companies?.filter(c => c.company_status === "active") ?? [];
      if (activeCompanies.length === 1) router.push(`/company/${activeCompanies[0].slug}/dashboard`);
      else router.push("/company/select");
  };

  const handleLogout = async () => {
    await fetch('/logout', { method: 'POST' });
    setUser(null);
    setDisplayName('');
    setDisplayAvatar('');
    document.cookie = 'zy_display=; Max-Age=0; path=/';
    document.cookie = 'zy_avatar=; Max-Age=0; path=/';
    window.location.href = "/";
  };

 const userForDropdown = user
  ? { name: user.full_name, avatar: displayAvatar, ...user }
  : { name: displayName, avatar: displayAvatar, zy_id: '', is_complete: true, is_super_admin: false, companies: [] };

  return (
    <>
      {/* Desktop nav items — hidden on mobile */}
      <button onClick={handleHostEvent}
        className="hidden md:block text-blue-900 border border-blue-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-50 transition">
        Host Event
      </button>

      <button onClick={() => router.push(isLoggedIn ? "/register/type" : "/login?next=/register/type")}
        className="hidden md:block bg-blue-900 text-white px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-800 transition">
        Get Started
      </button>

      <div className="hidden md:flex">
        {isLoggedIn ? (
          <NavUserDropdown user={userForDropdown} onLogout={handleLogout} />
        ) : (
          <a href="/login"
            className="text-blue-900 border border-blue-900 px-4 py-2 rounded-full text-sm font-semibold hover:bg-blue-50 transition">
            Login
          </a>
        )}
      </div>

      {/* Mobile nav — hidden on desktop */}
      <div className="md:hidden">
        <NavMobile isLoggedIn={isLoggedIn} userName={displayName} onHostEvent={handleHostEvent} />
      </div>
    </>
  );
}
