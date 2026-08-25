// THIS FILE GOES IN: components/shared/OREV1-130-EventPageClient.tsx (REPLACES existing file)
'use client'
import { useState, useEffect, useRef } from 'react'
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

export default function OREV1130EventPageClient({ event, isLoggedIn, initialInterested, initialCount }: { event: any; isLoggedIn: boolean; initialInterested: boolean; initialCount: number }) {
  const { theme } = useTheme()
  const [selectedSlotId, setSelectedSlotId] = useState<string>(event.venues[0]?.dates[0]?.times[0]?.id || '')
  const [interested, setInterested] = useState(initialInterested)
  const [count, setCount] = useState(initialCount || 0)
  const registeredRef = useRef(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('registerInterest') === '1' && isLoggedIn && !interested && !registeredRef.current) {
      registeredRef.current = true
      fetch('/event/event-interest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id }),
      })
        .then(res => res.json())
        .then(data => { if (!data.error) { setInterested(data.interested); setCount(data.count) } })
      window.history.replaceState({}, '', window.location.pathname)
    }
  }, [])

  const toggleInterested = async () => {
    if (!isLoggedIn) {
      const nextUrl = window.location.pathname + '?registerInterest=1'
      window.location.href = '/login?next=' + encodeURIComponent(nextUrl)
      return
    }
    const res = await fetch('/event/event-interest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: event.id }),
    })
    const data = await res.json()
    if (!data.error) { setInterested(data.interested); setCount(data.count) }
  }

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
              interested={interested}
              count={count}
              onToggleInterested={toggleInterested}
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
            interested={interested}
            count={count}
            onToggleInterested={toggleInterested}
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