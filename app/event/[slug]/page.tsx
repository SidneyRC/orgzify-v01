// THIS FILE GOES IN: app/event/[slug]/page.tsx (REPLACES existing file)
import type { Metadata } from "next";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Navbar from "@/components/shared/OREV1-026-Navbar";
import CityGate from "@/components/shared/OREV1-139-CityGate";
import OREV1130EventPageClient from "@/components/shared/OREV1-130-EventPageClient";
import { ThemeProvider } from "@/lib/ThemeContext";
import { getResolvedTheme } from "@/lib/getResolvedTheme";
import { getEventBySlugOrCode } from "@/lib/getEventBySlugOrCode";
import { checkEventVisibility } from "@/lib/checkEventVisibility";
import { getServerSession } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";
import { buildEventMetadata } from "@/lib/buildEventMetadata";
import { buildEventJsonLd } from "@/lib/buildEventJsonLd"; 
import { getRelatedEvents } from "@/lib/getRelatedEvents"; 
import { pickPublicEventFields } from "@/lib/pickPublicEventFields";

type Props = { params: Promise<{ slug: string }> };
const BASE_URL = "https://www.orgzify.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const session = await getServerSession();
  const event = await getEventBySlugOrCode(slug, session);
  if (!event || !(await checkEventVisibility(event, session))) return { title: "Event — Orgzify" };
  return buildEventMetadata(event, slug);
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const hasCity = /(^|;\s*)orgzify_city_id=/.test(cookieHeader);

  const session = await getServerSession();
  const event = await getEventBySlugOrCode(slug, session);

  let redirectSlug: string | null = null;
  if (!event) {
    const { data: redirect } = await supabaseAdmin
      .from('event_slug_redirects')
      .select('event_id')
      .eq('old_slug', slug)
      .order('created_at', { ascending: false })
      .maybeSingle();
    if (redirect) {
      const { data: currentEvent } = await supabaseAdmin.from('events').select('slug').eq('id', redirect.event_id).maybeSingle();
      if (currentEvent) redirectSlug = currentEvent.slug;
    }
  }
  if (redirectSlug) redirect(`/event/${redirectSlug}`);

  let initialInterested = false;
  let initialCount = 0;
  if (event) {
    const { count } = await supabaseAdmin
      .from('event_interests')
      .select('id', { count: 'exact', head: true })
      .eq('event_id', event.id);
    initialCount = count || 0;

    if (session) {
      const { data: interestRow } = await supabaseAdmin
        .from('event_interests')
        .select('id')
        .eq('event_id', event.id)
        .eq('user_id', session.user_id)
        .maybeSingle();
      initialInterested = !!interestRow;
    }
  }

  if (!event || !(await checkEventVisibility(event, session))) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center text-center px-6">
          <p className="text-lg text-gray-500">This event isn't available.</p>
        </div>
      </>
    );
  }

  const theme: any = await getResolvedTheme(event.reporting_office_id); if (theme) { delete theme.created_by; delete theme.created_at; delete theme.updated_at } const cityPart = cookieHeader.split(";").map(c => c.trim()).find(c => c.startsWith("orgzify_city_id=")); const related = await getRelatedEvents(event, cityPart ? decodeURIComponent(cityPart.split("=")[1]) : null, session ? session.user_id : null);

  const eventJsonLd = buildEventJsonLd(event, slug);
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Events", item: `${BASE_URL}/events` },
      { "@type": "ListItem", position: 3, name: event.category_name, item: `${BASE_URL}/events?category=${event.category_name}` },
      { "@type": "ListItem", position: 4, name: event.name, item: BASE_URL + "/event/" + (event.slug || slug) },
    ],
  };

  return (
    <ThemeProvider initial={theme}>
      <Navbar theme={theme} />
      <CityGate hasCity={hasCity} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <OREV1130EventPageClient event={pickPublicEventFields({ ...event, recommendations: related })} isLoggedIn={!!session} initialInterested={initialInterested} initialCount={initialCount} />
    </ThemeProvider>
  );
}
