// components/shared/OREV1-139-CityGate.tsx

"use client";

import { useState, useEffect } from "react";
import CityPickerModal from "@/components/shared/OREV1-138-CityPickerModal";
import type { PickerCity } from "@/components/shared/OREV1-138A-CityPickerList";

export default function CityGate({ hasCity }: { hasCity: boolean }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasCity) setOpen(true);
  }, [hasCity]);

  useEffect(() => {
    const handler = () => setOpen(true);
    window.addEventListener("orgzify:open-city-picker", handler);
    return () => window.removeEventListener("orgzify:open-city-picker", handler);
  }, []);

  const handleSelect = (city: PickerCity) => {
    document.cookie = `orgzify_city_id=${encodeURIComponent(city.id)}; path=/; max-age=31536000`;
    document.cookie = `orgzify_city_name=${encodeURIComponent(city.name)}; path=/; max-age=31536000`;
    setOpen(false);
    window.location.href = window.location.href;
  };

  if (!open) return null;

  return (
    <CityPickerModal
      onSelect={handleSelect}
      onClose={() => setOpen(false)}
    />
  );
}
