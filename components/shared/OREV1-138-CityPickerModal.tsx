// components/shared/OREV1-138-CityPickerModal.tsx

"use client";

import { useState, useEffect, useMemo } from "react";
import { useTheme } from "@/lib/ThemeContext";
import CityPickerList, { PickerCity } from "@/components/shared/OREV1-138A-CityPickerList";

type CountryGroup = { country_id: string; country_name: string; flag_url: string; cities: PickerCity[] };

export default function CityPickerModal({ onSelect, onClose }: {
  onSelect: (city: PickerCity) => void;
  onClose: () => void;
}) {
  const { theme } = useTheme();
  const [countries, setCountries] = useState<CountryGroup[]>([]);
  const [activeCountry, setActiveCountry] = useState<string>("");
  const [search, setSearch] = useState("");
  const [nearbyOrder, setNearbyOrder] = useState<string[] | null>(null);

  useEffect(() => {
    fetch("/citypicker/api")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const list: CountryGroup[] = data?.countries ?? [];
        setCountries(list);
        if (list.length > 0) setActiveCountry(list[0].country_id);
      });
  }, []);

  const allCities = useMemo(() => countries.flatMap(c => c.cities), [countries]);

  const searchResults = useMemo(() => {
    if (!search.trim()) return null;
    const q = search.trim().toLowerCase();
    return allCities.filter(c => c.name.toLowerCase().includes(q));
  }, [search, allCities]);

  const activeGroup = countries.find(c => c.country_id === activeCountry);
  let visibleCities: PickerCity[] = searchResults ?? activeGroup?.cities ?? [];

  if (!searchResults && nearbyOrder) {
    const rank = new Map(nearbyOrder.map((id, i) => [id, i]));
    visibleCities = [...visibleCities].sort((a, b) => (rank.get(a.id) ?? 999) - (rank.get(b.id) ?? 999));
  }

  const handleUseLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const res = await fetch("/citypicker/api/nearby", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        });
        const data = await res.json();
        if (data?.orderedCityIds) setNearbyOrder(data.orderedCityIds);
      },
      () => { /* denied or unsupported — silently fall back to manual picking */ }
    );
  };

  const accent = theme?.btn_bg ?? "#1e3a8a";
  const mutedText = theme?.color_text_muted || '#9ca3af';

  return (
        <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/40">
        <div style={{ ['--focus-border' as any]: theme?.input_focus_border || accent }} className="bg-white w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl max-h-[85vh] flex flex-col">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 relative">
          <h2 className="text-lg font-bold text-gray-900 w-full text-center">Where are you heading?</h2>
          <button onClick={onClose} className="absolute right-5 text-gray-400 hover:text-gray-600 text-xl leading-none">×</button>
        </div>

        <div className="px-5 pt-3 flex items-center gap-2">
                    <div style={{ borderColor: theme?.input_border || '#e5e7eb' }} className="flex-1 flex items-center gap-2 border rounded-full px-4 py-2 transition focus-within:border-[var(--focus-border)]">
            <svg style={{ color: mutedText }} className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
            </svg>
                        <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search city..."
                            className="flex-1 text-sm bg-transparent"
              style={{ outline: 'none', border: 'none', boxShadow: 'none' }}
            />
          </div>
          <button onClick={handleUseLocation} style={{ borderColor: theme?.input_border || '#e5e7eb' }} className="p-2.5 rounded-full border hover:bg-gray-50 shrink-0" title="Use my location">
            <svg style={{ color: mutedText }} className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a2 2 0 01-2.828 0l-4.243-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {!searchResults && (
          <div className="flex gap-2 px-5 pt-3 overflow-x-auto">
            {countries.map(c => (
              <button
                key={c.country_id}
                onClick={() => setActiveCountry(c.country_id)}
                style={activeCountry === c.country_id ? { borderColor: accent, color: accent, backgroundColor: `${accent}14` } : {}}
                className={`shrink-0 flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold uppercase tracking-wide border transition ${
                  activeCountry === c.country_id ? "" : "border-gray-200 text-gray-500"
                }`}
              >
                <img src={c.flag_url} alt="" className="w-4 h-3 object-cover rounded-sm" />
                {c.country_name}
              </button>
            ))}
          </div>
        )}

        <div className="p-5 overflow-y-auto">
          <CityPickerList cities={visibleCities} onSelect={onSelect} />
        </div>
      </div>
    </div>
  );
}
