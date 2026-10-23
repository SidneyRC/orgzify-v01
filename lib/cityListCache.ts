// THIS FILE GOES IN: lib/cityListCache.ts (NEW FILE)
// Keeps the city picker list ready in the browser, so the picker opens with no wait.
// The list starts loading in the background as soon as the picker code is loaded (home page),
// and it is fetched again every time the picker opens, so it is always fresh.
// Used by components/shared/OREV1-138-CityPickerModal.tsx (a shared file, so the home page can also call loadCities later).
import type { PickerCity } from "@/components/shared/OREV1-138A-CityPickerList";

export type CountryGroup = { country_id: string; country_name: string; flag_url: string; cities: PickerCity[] };

let cached: CountryGroup[] | null = null;

export const getCachedCities = () => cached;

export function loadCities(): Promise<CountryGroup[] | null> {
  return fetch("/citypicker/api")
    .then(r => (r.ok ? r.json() : null))
    .then(d => {
      const list: CountryGroup[] | null = d?.countries ?? null;
      if (list) cached = list;
      return list;
    })
    .catch(() => null);
}

if (typeof window !== "undefined") loadCities();
