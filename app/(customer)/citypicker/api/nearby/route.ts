// app/(customer)/citypicker/api/nearby/route.ts

import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function POST(req: Request) {
  try {
    const { lat, lng } = await req.json();
    if (typeof lat !== "number" || typeof lng !== "number") {
      return NextResponse.json({ error: "Missing coordinates" }, { status: 400 });
    }

    const { data: liveEvents, error: evErr } = await supabaseAdmin
      .from("events")
      .select("id")
      .eq("status", "active")
      .eq("visibility", "public")
      .neq("event_status", "cancelled");

    if (evErr) return NextResponse.json({ error: evErr.message }, { status: 500 });
    const eventIds = (liveEvents ?? []).map(e => e.id);
    if (eventIds.length === 0) return NextResponse.json({ orderedCityIds: [] });

    const { data: eventVenues, error: evVenueErr } = await supabaseAdmin
      .from("event_venues")
      .select("venue_id")
      .in("event_id", eventIds);

    if (evVenueErr) return NextResponse.json({ error: evVenueErr.message }, { status: 500 });
    const venueIds = [...new Set((eventVenues ?? []).map(r => r.venue_id))];
    if (venueIds.length === 0) return NextResponse.json({ orderedCityIds: [] });

    const { data: venues, error: venueErr } = await supabaseAdmin
      .from("venues")
      .select("id, city_id, latitude, longitude")
      .in("id", venueIds);

    if (venueErr) return NextResponse.json({ error: venueErr.message }, { status: 500 });

    const withDistance = (venues ?? [])
      .filter(v => v.city_id && v.latitude != null && v.longitude != null)
      .map(v => ({
        city_id: v.city_id as string,
        distance: haversineKm(lat, lng, Number(v.latitude), Number(v.longitude)),
      }))
      .sort((a, b) => a.distance - b.distance);

    const seen = new Set<string>();
    const orderedCityIds: string[] = [];
    for (const row of withDistance) {
      if (!seen.has(row.city_id)) {
        seen.add(row.city_id);
        orderedCityIds.push(row.city_id);
      }
    }

    return NextResponse.json({ orderedCityIds });
  } catch (err: any) {
    return NextResponse.json({ error: err.message ?? "Unknown error" }, { status: 500 });
  }
}