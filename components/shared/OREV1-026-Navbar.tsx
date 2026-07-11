import { headers } from 'next/headers';
import NavUserSection from "@/components/shared/OREV1-035-NavUserSection";

export default async function Navbar() {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie') ?? '';

  const getName = (cookie: string) => {
    const match = cookie.match(/(^|;\s*)zy_display=([^;]+)/);
    return match ? decodeURIComponent(match[2]) : '';
  };

  const getAvatar = (cookie: string) => {
    const match = cookie.match(/(^|;\s*)zy_avatar=([^;]+)/);
    return match ? decodeURIComponent(match[2]) : '';
  };

  const displayName = getName(cookieHeader);
  const displayAvatar = getAvatar(cookieHeader);

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

          <NavUserSection initialName={displayName} initialAvatar={displayAvatar} />
        </div>
      </div>
    </header>
  );
}
