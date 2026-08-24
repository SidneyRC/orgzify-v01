"use client";

// components/shared/OREV1-138A-CityPickerList.tsx
import { useTheme } from "@/lib/ThemeContext";

export type PickerCity = { id: string; name: string; image_url: string | null };

export default function CityPickerList({
  cities,
  onSelect,
}: {
  cities: PickerCity[];
  onSelect: (city: PickerCity) => void;
}) {
  const { theme } = useTheme();
  const accent = theme?.btn_bg ?? "#1e3a8a";
  const accentText = theme?.btn_text ?? "#ffffff";
  const cardShadow = theme?.card_shadow ?? "0 1px 3px rgba(0,0,0,0.08)";
  const radius = theme?.global_border_radius ?? "0.75rem";

  if (cities.length === 0) {
    return (
      <p className="text-sm text-gray-400 text-center py-6">
        We're just getting started here!!!
      </p>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {cities.map(city => (
        <button
          key={city.id}
          onClick={() => onSelect(city)}
          style={{ boxShadow: cardShadow, borderRadius: radius }}
          className="group flex sm:flex-col items-center gap-3 sm:gap-2 p-3 sm:p-4 bg-white text-left sm:text-center transition-shadow hover:shadow-md relative overflow-hidden"
        >
          <span
            className="absolute left-0 top-0 h-full w-0 group-hover:w-1 transition-all"
            style={{ backgroundColor: accent }}
          />
          {city.image_url ? (
            <img
              src={city.image_url}
              alt={city.name}
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full object-cover shrink-0"
            />
          ) : (
            <div
              className="w-10 h-10 sm:w-14 sm:h-14 rounded-full flex items-center justify-center text-sm sm:text-base font-bold shrink-0"
              style={{ backgroundColor: accent, color: accentText }}
            >
              {city.name.charAt(0).toUpperCase()}
            </div>
          )}
          <span className="text-sm font-medium text-gray-800 truncate">{city.name}</span>
        </button>
      ))}
    </div>
  );
}