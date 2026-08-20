// THIS FILE GOES IN: components/shared/OREV1-100-EventRegistration.tsx (REPLACES existing file)
'use client'
import { useState, useEffect } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import OREV1100BEventStepperHeader from '@/components/shared/OREV1-100B-EventStepperHeader'
import OREV1106EventStepType from '@/components/shared/OREV1-106-EventStepType'
import OREV1107EventStepInfo from '@/components/shared/OREV1-107-EventStepInfo'
import OREV1108EventStepAdditional from '@/components/shared/OREV1-108-EventStepAdditional'
import OREV1109EventStepMedia from '@/components/shared/OREV1-109-EventStepMedia'
import OREV1111EventStepVenue from '@/components/shared/OREV1-111-EventStepVenue'
import OREV1112EventStepSchedule from '@/components/shared/OREV1-112-EventStepSchedule'
import OREV1113EventStepBookingMethod from '@/components/shared/OREV1-113-EventStepBookingMethod'
import OREV1114EventStepTicketCategories from '@/components/shared/OREV1-114-EventStepTicketCategories'
import OREV1115EventStepReview from '@/components/shared/OREV1-115-EventStepReview'

export type EventDraft = {
  id: string; process_id: string; name: string; slug: string; status: string; under_review?: boolean
  event_format: string; category_id: string | null; sub_category_id: string | null; languages?: string[] | null
  visibility: string; min_age: number | null; event_duration_minutes?: number | null; refund_allowed: boolean
  description: string | null; terms_conditions: string | null
  social_facebook_url?: string | null; social_instagram_url?: string | null
  social_x_url?: string | null; social_youtube_url?: string | null; social_website_url?: string | null
}

const STEP_LABELS_PHYSICAL = ['Event Type', 'Event Info', 'Additional Info', 'Media', 'Venue', 'Schedule', 'Booking Method', 'Tickets', 'Review']
const STEP_LABELS_VIRTUAL = ['Event Type', 'Event Info', 'Additional Info', 'Media', 'Schedule', 'Booking Method', 'Tickets', 'Review']
const ADMIN_LIST_URL = '/admin/ecosystem/events'

export default function OREV1100EventRegistration({ entityId, entitySlug, adminMode }: { entityId: string; entitySlug: string; adminMode?: 'view' | 'edit' }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { theme } = useTheme()
  const [event, setEvent] = useState<EventDraft | null>(null)
  const [loading, setLoading] = useState(true)
  const [eventFormat, setEventFormat] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const closeUrl = `/biz/${entitySlug}/events`

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (!ref) { setLoading(false); return }
    const init = async () => {
      const res = await fetch(`/biz/events/api?process_id=${ref}`)
      const j = await res.json()
      const ev: EventDraft | null = j.data || null
      setEvent(ev)
      if (!ev) { setLoading(false); return }
      setEventFormat(ev.event_format)
      const isPhys = ev.event_format !== 'virtual'
      const scheduleStepNum = isPhys ? 6 : 5
      const bookingStepNum = scheduleStepNum + 1
      const ticketStepNum = bookingStepNum + 1

      let reached = ev.description ? 4 : 3
      const mediaRes = await fetch(`/biz/events/media/api?event_id=${ev.id}`)
      const mediaJson = await mediaRes.json()
      const hasBanner = (mediaJson.data || []).some((m: any) => m.section === 'banner')

      if (hasBanner) {
        reached = isPhys ? 5 : scheduleStepNum
        if (isPhys) {
          const venRes = await fetch(`/biz/events/eventvenue/api?event_id=${ev.id}`)
          const venJson = await venRes.json()
          if ((venJson.selected || []).length > 0) reached = scheduleStepNum
        }
        const bmRes = await fetch(`/biz/events/eventvenue/bookingmethod/api?event_id=${ev.id}`)
        const bmJson = await bmRes.json()
        if (bmJson.data) {
          reached = bookingStepNum
          const tkRes = await fetch(`/biz/events/eventvenue/tickets/api?event_id=${ev.id}`)
          const tkJson = await tkRes.json()
          if ((tkJson.tickets || []).length > 0) {
            reached = ticketStepNum
            if (ev.status === 'pending' || ev.status === 'active') reached = ticketStepNum + 1
          }
        }
      }

      setMaxReachedStep(adminMode ? ticketStepNum + 1 : reached)
      setCurrentStep(adminMode ? 1 : reached)
      setLoading(false)
    }
    init()
  }, [searchParams])

  const isLocked = adminMode === 'view' || (event?.status === 'pending' && adminMode !== 'edit')
  const isPhysical = eventFormat !== 'virtual'
  const steps = isPhysical ? STEP_LABELS_PHYSICAL : STEP_LABELS_VIRTUAL
  const scheduleStep = isPhysical ? 6 : 5
  const bookingStep = scheduleStep + 1
  const ticketStep = bookingStep + 1
  const reviewStep = ticketStep + 1
  const stepNumbers = { info: 2, additional: 3, media: 4, schedule: scheduleStep, booking: bookingStep }

  const goTo = (step: number, reached?: number) => {
    setCurrentStep(step)
    if (reached && reached > maxReachedStep) setMaxReachedStep(reached)
  }

  const handleClose = () => { router.push(adminMode ? ADMIN_LIST_URL : closeUrl) }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: theme?.page_bg || '#f9fafb' }}>
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  )

  return (
    <div className="px-4 md:px-10 py-6 md:py-8 w-full" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>{adminMode === 'view' ? 'Viewing Event (Read-only)' : 'Event Builder'}</h1>
          <p className="text-xs mt-0.5" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{adminMode ? 'Admin mode — browse using Back/Next on each step' : 'Complete each step — your progress is saved as you go'}</p>
        </div>
        {event && <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">{event.process_id}</span>}
      </div>

      <OREV1100BEventStepperHeader steps={steps} currentStep={currentStep} maxReachedStep={maxReachedStep} onStepClick={s => goTo(s)} />

      <div className="mt-4">
        {currentStep === 1 && (
          <OREV1106EventStepType value={eventFormat} locked={!!event} onChange={setEventFormat} onContinue={() => goTo(2, 2)} onClose={handleClose} />
        )}
        {currentStep === 2 && (
          <OREV1107EventStepInfo event={event} entityId={entityId} eventFormat={eventFormat} locked={isLocked}
            onSaved={updated => { setEvent(updated); goTo(3, 3) }} onBack={() => goTo(1)} onClose={handleClose} />
        )}
        {currentStep === 3 && (
          <OREV1108EventStepAdditional event={event} locked={isLocked}
            onSaved={updated => { setEvent(updated); goTo(4, 4) }} onBack={() => goTo(2)} onClose={handleClose} />
        )}
        {currentStep === 4 && (
          <OREV1109EventStepMedia event={event} locked={isLocked}
            onSaved={updated => { setEvent(updated); goTo(5, 5) }} onBack={() => goTo(3)} onClose={handleClose} />
        )}
        {currentStep === 5 && isPhysical && event && (
          <OREV1111EventStepVenue eventId={event.id} entityId={entityId} entitySlug={entitySlug} processId={event.process_id} locked={isLocked}
            onContinue={() => goTo(6, 6)} onBack={() => goTo(4)} onClose={handleClose} />
        )}
        {currentStep === scheduleStep && event && (
          <OREV1112EventStepSchedule eventId={event.id} eventFormat={eventFormat} durationMinutes={event.event_duration_minutes || 0} locked={isLocked}
            onContinue={() => goTo(bookingStep, bookingStep)} onBack={() => goTo(isPhysical ? 5 : 4)} onClose={handleClose} />
        )}
        {currentStep === bookingStep && event && (
          <OREV1113EventStepBookingMethod eventId={event.id} locked={isLocked}
            onContinue={() => goTo(ticketStep, ticketStep)} onBack={() => goTo(scheduleStep)} onClose={handleClose} />
        )}
        {currentStep === ticketStep && event && (
          <OREV1114EventStepTicketCategories eventId={event.id} locked={isLocked} durationMinutes={event.event_duration_minutes || 0}
            onContinue={() => goTo(reviewStep, reviewStep)} onBack={() => goTo(bookingStep)} onClose={handleClose} />
        )}
        {currentStep === reviewStep && event && (
          <OREV1115EventStepReview event={event} locked={isLocked} steps={stepNumbers} theme={theme}
            onEditStep={s => goTo(s)} onBack={() => goTo(ticketStep)} onClose={handleClose}
            onSubmitted={() => setEvent(prev => prev ? { ...prev, status: 'pending' } : prev)} />
        )}
      </div>
    </div>
  )
}