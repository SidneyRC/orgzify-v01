"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import AdminSidebar from "@/components/admin/OREV1-016-AdminSidebar";
import {
  Bell,
  Menu,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  User,
  Lock,
  LogOut,
  Plus,
} from "lucide-react";

// ─── Config ───────────────────────────────────────────────────────────────────
const CARDS_PER_SLIDE = 2;

// ─── Dummy Carousel Data ──────────────────────────────────────────────────────
const carouselCards = [
  { id: 1, title: "Summer Drawing Championship 2026", date: "15 June 2026", location: "Chennai", gradient: "from-blue-600 to-blue-900", href: "#" },
  { id: 2, title: "Inter-School Chess Tournament", date: "20 July 2026", location: "Bangalore", gradient: "from-violet-600 to-blue-900", href: "#" },
  { id: 3, title: "Yoga & Wellness Fest 2026", date: "3 August 2026", location: "Coimbatore", gradient: "from-teal-600 to-blue-900", href: "#" },
  { id: 4, title: "Athletics Meet 2026", date: "12 September 2026", location: "Chennai", gradient: "from-blue-600 to-blue-900", href: "#" },
];

// ─── Dummy Notification Data ──────────────────────────────────────────────────
const dummyNotifications = [
  { id: 1, text: "KYC submitted by Sunrise Academy", time: "2 mins ago", read: false },
  { id: 2, text: "New registration for Drawing Championship 2026", time: "18 mins ago", read: false },
  { id: 3, text: "Profile tag requested by Arjun's parent", time: "1 hour ago", read: false },
  { id: 4, text: "KYC approved — Chennai Chess Club", time: "Yesterday", read: true },
  { id: 5, text: "Duplicate detected in upload — Athletics Meet", time: "2 days ago", read: true },
];

// ─── Dummy User Data ──────────────────────────────────────────────────────────
const dummyUser = {
  name: "Sidney",
  email: "sidney@orgzify.com",
  initials: "S",
  academies: [
    { id: "a1", name: "Sunrise Academy", status: "Approved" },
    { id: "a2", name: "Star Kids Chess", status: "Pending" },
  ],
  organisations: [
    { id: "o1", name: "Chennai Events Co.", status: "Approved" },
    { id: "o2", name: "Artzone Pvt Ltd", status: "Under Review" },
  ],
};

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    Approved: "bg-green-50 text-green-700 border border-green-200",
    Pending: "bg-yellow-50 text-yellow-700 border border-yellow-200",
    "Under Review": "bg-blue-50 text-blue-700 border border-blue-200",
    Rejected: "bg-red-50 text-red-700 border border-red-200",
  };
  return (
    <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${styles[status] ?? "bg-gray-100 text-gray-500"}`}>
      {status}
    </span>
  );
}

// ─── Bell Dropdown ────────────────────────────────────────────────────────────
function BellDropdown({ onClose }: { onClose: () => void }) {
  const unreadCount = dummyNotifications.filter(n => !n.read).length;

  return (
    <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
        <span className="text-sm font-semibold text-gray-800">Notifications</span>
        {unreadCount > 0 && (
          <span className="text-[10px] font-medium bg-blue-900 text-white px-2 py-0.5 rounded-full">
            {unreadCount} new
          </span>
        )}
      </div>

      <div className="divide-y divide-gray-50 max-h-72 overflow-y-auto">
        {dummyNotifications.map(n => (
          <div key={n.id} className="flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer">
            <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? "bg-gray-300" : "bg-blue-900"}`} />
            <div className="min-w-0">
              <p className="text-xs text-gray-800 leading-snug">{n.text}</p>
              <p className="text-[10px] text-gray-400 mt-1">{n.time}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 py-2.5 border-t border-gray-100 text-center">
        <button className="text-xs font-medium text-blue-900 hover:underline">
          View all notifications
        </button>
      </div>
    </div>
  );
}

// ─── Avatar Dropdown ──────────────────────────────────────────────────────────
function AvatarDropdown({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const go = (path: string) => { onClose(); router.push(path); };

  return (
    <div className="absolute right-0 top-full mt-2 w-64 bg-white border border-gray-200 rounded-xl shadow-lg z-50 overflow-hidden">

      {/* User info */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
        <div className="w-9 h-9 rounded-full bg-blue-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
          {dummyUser.initials}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">{dummyUser.name}</p>
          <p className="text-[11px] text-gray-400 truncate">{dummyUser.email}</p>
        </div>
      </div>

      {/* Profile */}
      <button onClick={() => go("/profile/edit")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
        <User size={15} className="text-gray-400 shrink-0" />
        Profile
      </button>

      <div className="border-t border-gray-100" />

      {/* Academies */}
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">My Academies</span>
        <button onClick={() => go("/kyc?type=academy")} className="flex items-center gap-0.5 text-[11px] font-medium text-blue-900 hover:underline">
          <Plus size={11} /> Add Academy
        </button>
      </div>
      {dummyUser.academies.map(a => (
        <button key={a.id} onClick={() => go(`/academy/${a.id}/dashboard`)} className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-gray-50 transition-colors">
          <span className="text-xs text-gray-700 truncate">{a.name}</span>
          <StatusBadge status={a.status} />
        </button>
      ))}

      <div className="border-t border-gray-100 mt-1" />

      {/* Organisations */}
      <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
        <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">My Organisations</span>
        <button onClick={() => go("/kyc?type=organiser")} className="flex items-center gap-0.5 text-[11px] font-medium text-blue-900 hover:underline">
          <Plus size={11} /> Add Organisation
        </button>
      </div>
      {dummyUser.organisations.map(o => (
        <button key={o.id} onClick={() => go(`/organisation/${o.id}/dashboard`)} className="w-full flex items-center justify-between px-4 py-1.5 hover:bg-gray-50 transition-colors">
          <span className="text-xs text-gray-700 truncate">{o.name}</span>
          <StatusBadge status={o.status} />
        </button>
      ))}

      <div className="border-t border-gray-100 mt-1" />

      {/* Change Password */}
      <button onClick={() => go("/profile/change-password")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors text-left">
        <Lock size={15} className="text-gray-400 shrink-0" />
        Change Password
      </button>

      {/* Logout */}
      <button onClick={() => go("/")} className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors text-left">
        <LogOut size={15} className="shrink-0" />
        Logout
      </button>
    </div>
  );
}

// ─── Shared Carousel Hook ─────────────────────────────────────────────────────
function useCarousel(cardsPerSlide: number) {
  const totalPairs = Math.ceil(carouselCards.length / cardsPerSlide);
  const [pairIndex, setPairIndex] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setPairIndex(p => (p + 1) % totalPairs);
    }, 4000);
  }, [totalPairs]);

  useEffect(() => {
    startTimer();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [startTimer]);

  const prev = () => { setPairIndex(p => (p - 1 + totalPairs) % totalPairs); startTimer(); };
  const next = () => { setPairIndex(p => (p + 1) % totalPairs); startTimer(); };
  const visibleCards = carouselCards.slice(pairIndex * cardsPerSlide, pairIndex * cardsPerSlide + cardsPerSlide);

  return { visibleCards, prev, next };
}

// ─── Carousel UI ──────────────────────────────────────────────────────────────
function CarouselUI({ visibleCards, prev, next }: ReturnType<typeof useCarousel>) {
  return (
    <div className="flex items-center gap-1.5 w-full">
      <button onClick={prev} className="shrink-0 p-1 text-gray-400 hover:text-blue-900 rounded transition-colors">
        <ChevronLeft size={15} />
      </button>
      <div className="flex-1 flex gap-2 overflow-hidden">
        {visibleCards.map(card => (
          <a key={card.id} href={card.href} target="_blank" rel="noopener noreferrer"
            className={`flex-1 flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-gradient-to-r ${card.gradient} text-white overflow-hidden min-w-0`}
          >
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

// ─── Top Bar ──────────────────────────────────────────────────────────────────
function AdminTopBar({ onHamburgerClick }: { onHamburgerClick: () => void }) {
  const [bellOpen, setBellOpen] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const carousel = useCarousel(CARDS_PER_SLIDE);
  const unreadCount = dummyNotifications.filter(n => !n.read).length;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(e.target as Node)) setBellOpen(false);
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center px-3 gap-2 shrink-0 z-10">
      <button onClick={onHamburgerClick} className="md:hidden p-2 text-gray-500 hover:text-blue-900 rounded-md hover:bg-gray-100 transition-colors">
        <Menu size={20} />
      </button>

      <div className="hidden md:flex flex-1 items-center overflow-hidden">
        <CarouselUI {...carousel} />
      </div>

      <div className="flex-1 md:hidden" />

      {/* Bell */}
      <div className="relative" ref={bellRef}>
        <button onClick={() => { setBellOpen(o => !o); setAvatarOpen(false); }} className="relative p-2 text-gray-500 hover:text-blue-900 rounded-md hover:bg-gray-100 transition-colors">
          <Bell size={19} />
          {unreadCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-yellow-400 rounded-full border border-white" />}
        </button>
        {bellOpen && <BellDropdown onClose={() => setBellOpen(false)} />}
      </div>

      {/* Avatar */}
      <div className="relative" ref={avatarRef}>
        <button onClick={() => { setAvatarOpen(o => !o); setBellOpen(false); }} className="flex items-center gap-2 p-1 rounded-lg hover:bg-gray-100 transition-colors">
          <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white text-sm font-bold shrink-0">
            {dummyUser.initials}
          </div>
          <span className="hidden md:block text-sm text-gray-700 font-medium pr-1">{dummyUser.name}</span>
        </button>
        {avatarOpen && <AvatarDropdown onClose={() => setAvatarOpen(false)} />}
      </div>
    </header>
  );
}

// ─── Mobile Carousel Strip ────────────────────────────────────────────────────
function MobileCarouselStrip() {
  const carousel = useCarousel(1);
  return (
    <div className="md:hidden bg-white border-b border-gray-200 px-3 py-2.5 flex items-center shrink-0">
      <CarouselUI {...carousel} />
    </div>
  );
}

// ─── Admin Layout ─────────────────────────────────────────────────────────────
export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarExpanded, setSidebarExpanded] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <AdminSidebar
        expanded={sidebarExpanded}
        setExpanded={setSidebarExpanded}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar onHamburgerClick={() => setMobileOpen(true)} />
        <MobileCarouselStrip />
        <main className="flex-1 overflow-auto p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
