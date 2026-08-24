// THIS FILE GOES IN: components/shared/OREV1-130-EventPageClient.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import OREV1120EventHeroBanner from '@/components/shared/OREV1-120-EventHeroBanner'
import OREV1136EventTitleShare from '@/components/shared/OREV1-136-EventTitleShare'
import OREV1123EventAboutSection from '@/components/shared/OREV1-123-EventAboutSection'
import OREV1134EventArtistsCarousel from '@/components/shared/OREV1-134-EventArtistsCarousel'
import OREV1135EventTermsSection from '@/components/shared/OREV1-135-EventTermsSection'
import OREV1121EventGallery from '@/components/shared/OREV1-121-EventGallery'
import OREV1133EventOrganiserSponsors from '@/components/shared/OREV1-133-EventOrganiserSponsors'
import OREV1126EventBookingBox from '@/components/shared/OREV1-126-EventBookingBox'
import OREV1137MobileStickyBookBar from '@/components/shared/OREV1-137-MobileStickyBookBar'
import OREV1128EventRecommendations from '@/components/shared/OREV1-128-EventRecommendations'
import OREV1129Footer from '@/components/shared/OREV1-129-Footer'

export default function OREV1130EventPageClient({ event }: { event: any }) {
  const { theme } = useTheme()
  const [selectedSlotId, setSelectedSlotId] = useState<string>(event.venues[0]?.dates[0]?.times[0]?.id || '')

  return (
    <div className="min-h-screen pb-20 lg:pb-0" style={{ backgroundColor: theme?.page_bg || '#fff' }}>
      <div className="max-w-[1440px] mx-auto px-8 py-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
        <div className="flex flex-col gap-8">
          <OREV1120EventHeroBanner banners={event.banners} />
          <OREV1136EventTitleShare event={event} />
          <div className="lg:hidden">
            <OREV1126EventBookingBox
              event={event}
              venues={event.venues}
              ticketsBySlot={event.ticketsBySlot}
              payment={event.payment}
              selectedSlotId={selectedSlotId}
              onSelectSlot={setSelectedSlotId}
              hideBookButton
            />
          </div>
          <OREV1123EventAboutSection description={event.description} />
          <OREV1134EventArtistsCarousel artists={event.artists} />
          <OREV1135EventTermsSection terms={event.terms_conditions} />
          <OREV1121EventGallery gallery={event.gallery} />
          <OREV1133EventOrganiserSponsors organiser={{ name: event.organiser_name, logo_url: event.organiser_logo_url }} sponsors={event.sponsors} />
        </div>
        <div className="hidden lg:block">
          <OREV1126EventBookingBox
            event={event}
            venues={event.venues}
            ticketsBySlot={event.ticketsBySlot}
            payment={event.payment}
            selectedSlotId={selectedSlotId}
            onSelectSlot={setSelectedSlotId}
          />
        </div>
      </div>
      <div className="max-w-[1440px] mx-auto px-8">
        <OREV1128EventRecommendations items={event.recommendations} />
      </div>
      <OREV1129Footer />
      <OREV1137MobileStickyBookBar venues={event.venues} ticketsBySlot={event.ticketsBySlot} payment={event.payment} />
    </div>
  )
}