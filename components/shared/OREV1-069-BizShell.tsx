"use client";

import { useState, useEffect } from "react";
import NavUserDropdown from "@/components/shared/OREV1-027-NavUserDropdown";
import { ThemeProvider, Theme } from "@/lib/ThemeContext";

type UserData = {
  name: string; email: string; avatar: string;
  is_super_admin: boolean;
  companies: { id: string; display_name: string; slug: string; company_status: string }[];
  entities: { id: string; process_id: string; display_name: string; status: string }[];
}

function BizTopBar({ initialName, initialAvatar }: { initialName: string; initialAvatar: string }) {
  const [userData, setUserData] = useState<UserData>({
    name: initialName, email: '', avatar: initialAvatar,
    is_super_admin: false, companies: [], entities: [],
  });

  useEffect(() => {
    fetch('/profile/me')
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const p = data?.profile ?? data;
        if (!p) return;
        const parts = (p.full_name ?? '').split(' ');
        const firstName = parts.find((w: string) => !w.endsWith('.')) ?? parts[0] ?? '';
        setUserData({
          name: firstName, email: p.email ?? '',
          avatar: p.photo_url ?? '',
          is_super_admin: p.is_super_admin ?? false,
          companies: p.companies ?? [],
          entities: p.entities ?? [],
        });
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-4 shrink-0 z-10">
      <a href="/" className="text-xl font-bold text-blue-900">
        Orgz<span className="text-yellow-400">ify</span>
      </a>
      <NavUserDropdown
        user={{ name: userData.name, email: userData.email, avatar: userData.avatar, is_super_admin: userData.is_super_admin, companies: userData.companies, entities: userData.entities }}
        onLogout={handleLogout}
      />
    </header>
  );
}

// Loads the same site-wide Default Theme used before a Company has its own —
// Business Profile has no theme of its own until Reporting Office is matched
// and approved, so this stays constant throughout registration + review.
export default function BizShell({ initialName, initialAvatar, children, theme: providedTheme }: {
  initialName: string; initialAvatar: string; children: React.ReactNode; theme?: Theme | null;
}) {
  const [theme, setTheme] = useState<Theme | null>(providedTheme ?? null);

  useEffect(() => {
    if (providedTheme) return; // caller already resolved the correct theme (e.g. Entity Dashboard)
    fetch('/admin/company/theme/api')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.theme) setTheme(data.theme); });
  }, [providedTheme]);

  return (
    <ThemeProvider initial={theme}>
      <div className="flex flex-col min-h-screen" style={{ backgroundColor: theme?.page_bg ?? '#f9fafb' }}>
        <BizTopBar initialName={initialName} initialAvatar={initialAvatar} />
        <main className="flex-1 p-4 md:p-6">
          {children}
        </main>
      </div>
    </ThemeProvider>
  );
}
