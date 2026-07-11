"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import AdminSidebar from "@/components/admin/OREV1-016-AdminSidebar";
import NavUserDropdown from "@/components/shared/OREV1-027-NavUserDropdown";
import { ThemeProvider, Theme } from "@/lib/ThemeContext";
import { Menu, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

const CARDS_PER_SLIDE = 2;
const carouselCards = [
  { id: 1, title: "Summer Drawing Championship 2026", date: "15 June 2026", location: "Chennai", gradient: "from-blue-600 to-blue-900", href: "#" },
  { id: 2, title: "Inter-School Chess Tournament", date: "20 July 2026", location: "Bangalore", gradient: "from-violet-600 to-blue-900", href: "#" },
  { id: 3, title: "Yoga & Wellness Fest 2026", date: "3 August 2026", location: "Coimbatore", gradient: "from-teal-600 to-blue-900", href: "#" },
  { id: 4, title: "Athletics Meet 2026", date: "12 September 2026", location: "Chennai", gradient: "from-blue-600 to-blue-900", href: "#" },
];

type UserData = {
  name: string; email: string; avatar: string;
  is_super_admin: boolean;
  companies: { id: string; display_name: string; slug: string; company_status: string }[];
}

function useCarousel(cardsPerSlide: number) {
  const total = Math.ceil(carouselCards.length / cardsPerSlide);
  const [idx, setIdx] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const start = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setIdx(p => (p + 1) % total), 4000);
  }, [total]);
  useEffect(() => { start(); return () => { if (timer.current) clearInterval(timer.current); }; }, [start]);
  const prev = () => { setIdx(p => (p - 1 + total) % total); start(); };
  const next = () => { setIdx(p => (p + 1) % total); start(); };
  const visible = carouselCards.slice(idx * cardsPerSlide, idx * cardsPerSlide + cardsPerSlide);
  return { visible, prev, next };
}

function CarouselUI({ visible, prev, next }: ReturnType<typeof useCarousel>) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <button onClick={prev} className="shrink-0 p-1 text-gray-400 hover:text-blue-900 rounded transition-colors">
        <ChevronLeft size={15} />
      </button>
      <div className="flex-1 flex gap-2 overflow-hidden">
        {visible.map(card => (
          <a key={card.id} href={card.href} target="_blank" rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r ${card.gradient} text-white overflow-hidden min-w-0`}>
            <div className="min-w-0">
              <div className="text-xs font-semibold truncate leading-tight">{card.title}</div>
              <div className="text-[10px] text-blue-200 mt-0.5">{card.date} · {card.location}</div>
            </div>
            <ExternalLink size={12} className="shrink-0 opacity-60" />
          </a>
        ))}
      </div>
      <button onClick={next} className="shrink-0 p-1 text-gray-400 hover:text-blue-900 rounded transition-colors">
        <ChevronRight size={15} />
      </button>
    </div>
  );
}

function AdminTopBar({ initialName, initialAvatar, onHamburgerClick, onCompanySelect }: {
  initialName: string; initialAvatar: string;
  onHamburgerClick: () => void;
  onCompanySelect: (company_id: string, slug: string) => void;
}) {
  const [userData, setUserData] = useState<UserData>({
    name: initialName, email: '', avatar: initialAvatar,
    is_super_admin: false, companies: [],
  });
  const carousel = useCarousel(CARDS_PER_SLIDE);

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
        });
      });
  }, []);

  const handleLogout = async () => {
    await fetch('/logout', { method: 'POST' });
    window.location.href = '/';
  };

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-3 gap-2 shrink-0 z-10">
      <button onClick={onHamburgerClick} className="md:hidden p-2 text-gray-500 hover:text-blue-900 rounded-md hover:bg-gray-100 transition-colors">
        <Menu size={20} />
      </button>
      <div className="hidden md:flex flex-1 items-center overflow-hidden">
        <CarouselUI {...carousel} />
      </div>
      <div className="flex-1 md:hidden" />
      <NavUserDropdown
        user={{ name: userData.name, email: userData.email, avatar: userData.avatar, is_super_admin: userData.is_super_admin, companies: userData.companies }}
        onLogout={handleLogout}
        onCompanySelect={onCompanySelect}
      />
    </header>
  );
}

function MobileCarouselStrip() {
  const carousel = useCarousel(1);
  return (
    <div className="md:hidden bg-white border-b border-gray-200 px-3 py-2.5 flex items-center shrink-0">
      <CarouselUI {...carousel} />
    </div>
  );
}

// Reads the active context cookie (via /company/context) so the sidebar shows
// the right company name/role/rights even when the page itself didn't pass them.
function useCompanyContext(companyName?: string) {
  const [ctx, setCtx] = useState<{ name?: string; role?: string; rights?: string[]; slug?: string } | null>(null);

  useEffect(() => {
    if (companyName) return; // page already gave us this directly, skip the extra call
    fetch('/company/context')
      .then(r => r.ok ? r.json() : null)
      .then(json => {
        if (json?.type === 'company') setCtx({ name: json.company_name, role: json.role, rights: json.rights, slug: json.slug });
        else setCtx(null);
      });
  }, [companyName]);

  return ctx;
}

export default function AdminShell({ initialName, initialAvatar, children, companyName, roleLabel, rights, slug }: {
  initialName: string; initialAvatar: string; children: React.ReactNode;
  companyName?: string; roleLabel?: string; rights?: string[]; slug?: string;
}) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [theme, setTheme] = useState<Theme | null>(null);
  const ctx = useCompanyContext(companyName);

  const effectiveCompanyName = companyName ?? ctx?.name;
  const effectiveRoleLabel = roleLabel ?? ctx?.role;
  const effectiveRights = rights ?? ctx?.rights;
  const effectiveSlug = slug ?? ctx?.slug;

  // Load default theme on shell mount
  useEffect(() => {
    fetch('/admin/company/theme/api')
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.theme) setTheme(data.theme); });
  }, []);

  // Called when user selects a company from navbar
  const handleCompanySelect = useCallback((company_id: string, slug: string) => {
    const url = company_id
      ? `/admin/company/theme/api?company_id=${company_id}`
      : '/admin/company/theme/api';
    fetch(url)
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.theme) setTheme(data.theme); });
  }, []);

  return (
    <ThemeProvider initial={theme}>
      <div className="flex h-screen overflow-hidden" style={{ backgroundColor: theme?.page_bg ?? '#f9fafb' }}>
        <AdminSidebar expanded={sidebarExpanded} setExpanded={setSidebarExpanded}
          mobileOpen={mobileOpen} setMobileOpen={setMobileOpen}
          companyName={effectiveCompanyName} roleLabel={effectiveRoleLabel} rights={effectiveRights} slug={effectiveSlug} />
        <div className="flex-1 flex flex-col min-w-0">
          <AdminTopBar initialName={initialName} initialAvatar={initialAvatar}
            onHamburgerClick={() => setMobileOpen(true)}
            onCompanySelect={handleCompanySelect} />
          <MobileCarouselStrip />
          <main className="flex-1 overflow-auto p-4 md:p-6">
            {children}
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
