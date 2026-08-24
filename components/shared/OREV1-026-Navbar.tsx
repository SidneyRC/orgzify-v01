// components/shared/OREV1-026-Navbar.tsx
import { headers } from 'next/headers';
import NavUserSection from "@/components/shared/OREV1-035-NavUserSection";
import CityTrigger from "@/components/shared/OREV1-139B-CityTrigger";
import type { Theme } from "@/lib/ThemeContext";
export default async function Navbar({ theme }: { theme?: Theme | null }) {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie') ?? '';
  const getCookie = (name: string) => {
    const match = cookieHeader.match(new RegExp(`(^|;\\s*)${name}=([^;]+)`));
    return match ? decodeURIComponent(match[2]) : '';
  };
  const displayName = getCookie('zy_display');
  const displayAvatar = getCookie('zy_avatar');
  const cityName = getCookie('orgzify_city_name');
  const topbarBg = theme?.topbar_bg || '#ffffff';
  const topbarBorder = theme?.topbar_border || '#f3f4f6';
  const linkColor = theme?.link_color || '#1e3a8a';
  const inputBorder = theme?.input_border || '#e5e7eb';
  const inputFocusBorder = theme?.input_focus_border || linkColor;
  const mutedText = theme?.color_text_muted || '#9ca3af';
  return (
    <header className="sticky top-0 z-50 shadow-sm"
      style={{ backgroundColor: topbarBg, borderBottom: `1px solid ${topbarBorder}`, ['--link-color' as any]: linkColor, ['--focus-border' as any]: inputFocusBorder }}>
      <div className="flex items-center justify-between px-6 py-3 gap-4">
        <a href="/" className="text-2xl font-bold text-blue-900 shrink-0">
          Orgz<span className="text-yellow-400">ify</span>
        </a>
        <nav className="hidden md:flex items-center gap-6 shrink-0 ml-6">
          <a href="/events" style={{ color: linkColor }} className="text-sm font-semibold transition opacity-80 hover:opacity-100">Events</a>
          <a href="#features" style={{ color: linkColor }} className="text-sm font-semibold transition opacity-80 hover:opacity-100">Features</a>
        </nav>
        <div style={{ borderColor: inputBorder }}
          className="hidden md:flex flex-1 border rounded-full px-4 py-2 gap-2 transition focus-within:border-[var(--focus-border)]">
          <svg style={{ color: mutedText }} className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
                    <input type="text" placeholder="Search events, categories, cities..."
          className="flex-1 text-sm text-gray-700 bg-transparent"
          style={{ outline: 'none', border: 'none', boxShadow: 'none' }} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <CityTrigger cityName={cityName} theme={theme} />
          <NavUserSection initialName={displayName} initialAvatar={displayAvatar} />
        </div>
      </div>
    </header>
  );
}
