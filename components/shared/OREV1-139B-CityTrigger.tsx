// components/shared/OREV1-139B-CityTrigger.tsx

"use client";
import type { Theme } from "@/lib/ThemeContext";

export default function CityTrigger({ cityName, theme, alwaysVisible }: { cityName?: string; theme?: Theme | null; alwaysVisible?: boolean }) {
  const openPicker = () => window.dispatchEvent(new CustomEvent("orgzify:open-city-picker"));
  const restBorder = theme?.input_border || '#e5e7eb';
  const hoverBorder = theme?.link_color || '#1e3a8a';
  const mutedText = theme?.color_text_muted || '#9ca3af';

  return (
    <button
      onClick={openPicker}
      style={{ borderColor: restBorder }}
      onMouseEnter={e => (e.currentTarget.style.borderColor = hoverBorder)}
      onMouseLeave={e => (e.currentTarget.style.borderColor = restBorder)}
            className={`${alwaysVisible ? "flex" : "hidden md:flex"} items-center gap-1 border rounded-full px-3 py-2 text-sm text-gray-600 transition outline-none focus:outline-none`}
    >
      <svg style={{ color: mutedText }} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
      {cityName || "Select City"}
    </button>
  );
}
