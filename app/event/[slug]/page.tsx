// THIS FILE GOES IN: app/event/[slug]/page.tsx (REPLACES existing file)
import type { Metadata } from "next";
import { headers } from "next/headers";
import Navbar from "@/components/shared/OREV1-026-Navbar";
import CityGate from "@/components/shared/OREV1-139-CityGate";
import OREV1130EventPageClient from "@/components/shared/OREV1-130-EventPageClient";
import { ThemeProvider } from "@/lib/ThemeContext";
import { getResolvedTheme } from "@/lib/getResolvedTheme";
import { getEventBySlugOrCode } from "@/lib/getEventBySlugOrCode";
import { checkEventVisibility } from "@/lib/checkEventVisibility";

type Props = { params: Promise<{ slug: string }> };
const BASE_URL = "https://www.orgzify.com";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlugOrCode(slug);
  if (!event) return { title: "Event — Orgzify" };
  const title = `${event.name} — Orgzify`;
  const description = (event.description || "").replace(/<[^>]*>/g, "").slice(0, 150);
  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/event/${slug}` },
    openGraph: { title, description, images: [{ url: event.banners[0]?.file_url || "" }] },
  };
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params;
  const cookieHeader = (await headers()).get("cookie") ?? "";
  const hasCity = /(^|;\s*)orgzify_city_id=/.test(cookieHeader);

  const event = await getEventBySlugOrCode(slug);

  if (!event || !checkEventVisibility(event)) {
    return (
      <>
        <Navbar />
        <div className="min-h-[60vh] flex items-center justify-center text-center px-6">
          <p className="text-lg text-gray-500">This event isn't available.</p>
        </div>
      </>
    );
  }

  const theme = await getResolvedTheme(event.reporting_office_id);

  const eventJsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.name,
    startDate: event.venues[0]?.dates[0]?.event_date,
    location: { "@type": "Place", name: event.venues[0]?.external_name, address: event.venues[0]?.line1 },
    image: event.banners[0]?.file_url,
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: BASE_URL },
      { "@type": "ListItem", position: 2, name: "Events", item: `${BASE_URL}/events` },
      { "@type": "ListItem", position: 3, name: event.category_name, item: `${BASE_URL}/events?category=${event.category_name}` },
      { "@type": "ListItem", position: 4, name: event.name, item: `${BASE_URL}/event/${slug}` },
    ],
  };

  return (
    <ThemeProvider initial={theme}>
      <Navbar theme={theme} />
      <CityGate hasCity={hasCity} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(eventJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <OREV1130EventPageClient event={event} />
    </ThemeProvider>
  );
}
