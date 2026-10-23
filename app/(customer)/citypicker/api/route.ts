// app/(customer)/citypicker/api/route.ts
import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { getLiveCities } from "@/lib/getLiveCityIds";

// Cities with at least one live event that still has an open session — grouped by country.
// "Live" = the shared rule in lib/isEventLive.ts (through lib/getLiveCityIds.ts).
export async function GET() {
  try {
    const { counts: cityCounts } = await getLiveCities();
    const cityIds = Object.keys(cityCounts);
    if (cityIds.length === 0) return NextResponse.json({ countries: [] });

    const { data: cities, error: cityErr } = await supabaseAdmin
      .from("locations")
      .select("id, name, country_id, image_url")
      .in("id", cityIds)
      .eq("level", "city");

    if (cityErr) return NextResponse.json({ error: cityErr.message }, { status: 500 });

    const countryIds = [...new Set((cities ?? []).map(c => c.country_id))];
    const { data: countries, error: countryErr } = await supabaseAdmin
      .from("country_master")
      .select("id, name, flag_url")
      .in("id", countryIds);

    if (countryErr) return NextResponse.json({ error: countryErr.message }, { status: 500 });

    const countryMap = new Map((countries ?? []).map(c => [c.id, c]));
    const grouped = new Map<string, { country_id: string; country_name: string; flag_url: string; cities: any[] }>();

    for (const city of cities ?? []) {
      const country = countryMap.get(city.country_id);
      if (!country) continue;
      if (!grouped.has(city.country_id)) {
        grouped.set(city.country_id, {
          country_id: city.country_id,
          country_name: country.name,
          flag_url: country.flag_url,
          cities: [],
        });
      }
      grouped.get(city.country_id)!.cities.push({
        id: city.id,
        name: city.name,
        image_url: city.image_url ?? null,
        _sortCount: cityCounts[city.id] ?? 0,
      });
    }

    const result = Array.from(grouped.values()).map(g => ({
      ...g,
      cities: g.cities
        .sort((a, b) => b._sortCount - a._sortCount)
        .map(({ _sortCount, ...rest }) => rest),
    }));

    return NextResponse.json({ countries: result });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}
