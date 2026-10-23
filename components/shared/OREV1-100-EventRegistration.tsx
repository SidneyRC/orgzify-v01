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
import OREV1142EventStatusModal from '@/components/shared/OREV1-142-EventStatusModal'
import StatusBadge from '@/components/shared/OREV1-017-StatusBadge'; import OREV1149EventDecisionButtons from '@/components/shared/OREV1-149-EventDecisionButtons'

export type EventDraft = {
    id: string; process_id: string; name: string; slug: string; status: string; under_review?: boolean; has_pending_edits?: boolean
  is_approved?: boolean; published?: boolean; booking_open?: boolean
  event_format: string; category_id: string | null; sub_category_id: string | null; languages?: string[] | null
  visibility: string; min_age: number | null; event_duration_minutes?: number | null; refund_allowed: boolean
  description: string | null; terms_conditions: string | null
  social_facebook_url?: string | null; social_instagram_url?: string | null
  social_x_url?: string | null; social_youtube_url?: string | null; social_website_url?: string | null
}

const STEP_LABELS_PHYSICAL = ['Event Type', 'Event Info', 'Additional Info', 'Media', 'Venue', 'Schedule', 'Tickets', 'Booking Method', 'Review']
const STEP_LABELS_VIRTUAL = ['Event Type', 'Event Info', 'Additional Info', 'Media', 'Schedule', 'Tickets', 'Booking Method', 'Review']
const ADMIN_LIST_URL = '/admin/ecosystem/events'

function getEventStatusLabel(event: EventDraft | null): string {
  if (!event) return 'Draft'
  if (event.under_review) return 'Under Review'
  if (event.status === 'active' && event.has_pending_edits) return 'Pending'
  if (event.status === 'active') return 'Active'
  if (event.is_approved && !event.published) return 'Approved'
  if (event.status === 'pending') return 'Pending'
  return 'Draft'
}

export default function OREV1100EventRegistration({ entityId, entitySlug, adminMode }: { entityId: string; entitySlug: string; adminMode?: 'view' | 'edit' }) {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { theme } = useTheme()
  const [event, setEvent] = useState<EventDraft | null>(null)
  const [loading, setLoading] = useState(true); const [notFound, setNotFound] = useState(false)
  const [eventFormat, setEventFormat] = useState('')
  const [currentStep, setCurrentStep] = useState(1)
  const [maxReachedStep, setMaxReachedStep] = useState(1)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const closeUrl = `/biz/${entitySlug}/events`

  useEffect(() => {
    const ref = searchParams.get('ref')
    if (!ref) { setLoading(false); return }
    const init = async () => {
      const res = await fetch(`/biz/events/api?process_id=${ref}`)
      const j = await res.json()
      const ev: EventDraft | null = j.data || null
      setEvent(ev)
      if (!ev) { setNotFound(true); setLoading(false); return }
      setEventFormat(ev.event_format)
      const isPhys = ev.event_format !== 'virtual'
      const scheduleStepNum = isPhys ? 6 : 5
      const ticketStepNum = scheduleStepNum + 1
      const bookingStepNum = ticketStepNum + 1

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
        const tkRes = await fetch(`/biz/events/eventvenue/tickets/api?event_id=${ev.id}`)
        const tkJson = await tkRes.json()
        const hasTickets = (tkJson.tickets || []).length > 0
        const bmRes = await fetch(`/biz/events/eventvenue/bookingmethod/api?event_id=${ev.id}`)
        const bmJson = await bmRes.json()
        if (hasTickets || bmJson.data) reached = ticketStepNum
        if (hasTickets && bmJson.data) {
          reached = bookingStepNum
          if (ev.status === 'pending' || ev.status === 'active') reached = bookingStepNum + 1
        }
      }

      setMaxReachedStep(adminMode ? bookingStepNum + 1 : reached)
      setCurrentStep(adminMode ? 1 : reached)
      setLoading(false)
    }
    init()
  }, [searchParams])

    const isLocked = adminMode === 'view' || (event?.status === 'pending' && adminMode !== 'edit') || !!event?.under_review
  const isPhysical = eventFormat !== 'virtual'
  const steps = isPhysical ? STEP_LABELS_PHYSICAL : STEP_LABELS_VIRTUAL
  const scheduleStep = isPhysical ? 6 : 5
  const ticketStep = scheduleStep + 1
  const bookingStep = ticketStep + 1
  const reviewStep = bookingStep + 1
  const stepNumbers = { info: 2, additional: 3, media: 4, schedule: scheduleStep, booking: bookingStep }

    useEffect(() => {
    if (currentStep === reviewStep && event?.process_id) {
            fetch(`/biz/events/api?process_id=${event.process_id}`)
        .then(res => res.json())
        .then(j => { if (j.data) setEvent(j.data) })
        .catch(() => {})
    }
  }, [currentStep])

  const goTo = (step: number, reached?: number) => {
    setCurrentStep(step)
    if (reached && reached > maxReachedStep) setMaxReachedStep(reached)
  }

  const handleClose = () => { router.push(adminMode ? ADMIN_LIST_URL : closeUrl) }

  if (notFound) return (<div className="flex flex-col items-center justify-center min-h-screen gap-4 px-6 text-center" style={{ backgroundColor: theme?.page_bg || '#f9fafb' }}><p className="text-lg font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Event page cannot be found</p><button onClick={handleClose} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition" style={{ backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#ffffff', borderRadius: theme?.global_border_radius || '12px' }}>Back to events</button></div>); if (loading) return (
    <div className="flex items-center justify-center min-h-screen" style={{ backgroundColor: theme?.page_bg || '#f9fafb' }}>
      <p className="text-sm text-gray-400">Loading…</p>
    </div>
  )

  return (
    <div className="px-4 md:px-10 py-6 md:py-8 w-full" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-2">
                <div>
          <h1 className="text-2xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>
            {adminMode === 'view' ? 'Viewing Event (Read-only)' : (event?.name || 'Event Builder')}
          </h1>
          {event && (
            <div className="mt-1">
              <StatusBadge status={getEventStatusLabel(event)} />
            </div>
          )}
        </div>
                  {event && (
          <div className="flex items-center gap-2">{adminMode && (event.status === 'pending' || (event.status === 'active' && event.under_review)) && <OREV1149EventDecisionButtons event={event} theme={theme} onDone={handleClose} />}
                       {adminMode !== 'view' && (
              <button onClick={() => setShowStatusModal(true)} disabled={!event.is_approved} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: theme?.global_border_radius || '12px' }} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition disabled:opacity-50">Change Status</button>
            )}

              {adminMode === 'view' && (
              <button onClick={() => router.push(`?ref=${event.process_id}&mode=edit_admin`)} style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: theme?.global_border_radius || '12px' }} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">✎ Edit</button>
            )}

            <a href={`/event/${event.slug}`} target="_blank" rel="noopener noreferrer" title="Open public event page" style={{ backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: theme?.global_border_radius || '12px' }} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">🔗 Link</a>
            <span className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-600 font-medium">{event.process_id}</span>
          </div>
        )}
      </div>

      {showStatusModal && event && (
        <OREV1142EventStatusModal
          eventId={event.id}
          published={(event as any).published || false}
          bookingOpen={(event as any).booking_open || false}
          onClose={() => setShowStatusModal(false)}
          onUpdated={fields => setEvent(prev => prev ? { ...prev, ...fields } as any : prev)}
        />
      )}

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
            onContinue={() => goTo(ticketStep, ticketStep)} onBack={() => goTo(isPhysical ? 5 : 4)} onClose={handleClose} />
        )}
        {currentStep === ticketStep && event && (
          <OREV1114EventStepTicketCategories eventId={event.id} locked={isLocked} durationMinutes={event.event_duration_minutes || 0}
            onContinue={() => goTo(bookingStep, bookingStep)} onBack={() => goTo(scheduleStep)} onClose={handleClose} />
        )}
        {currentStep === bookingStep && event && (
          <OREV1113EventStepBookingMethod eventId={event.id} locked={isLocked}
            onContinue={() => goTo(reviewStep, reviewStep)} onBack={() => goTo(ticketStep)} onClose={handleClose} />
        )}
        {currentStep === reviewStep && event && (
          <OREV1115EventStepReview event={event} locked={isLocked} steps={stepNumbers} theme={theme} adminMode={adminMode}
            onEditStep={s => goTo(s)} onBack={() => goTo(bookingStep)} onClose={handleClose}
                        onSubmitted={() => setEvent(prev => prev ? { ...prev, status: ['draft', 'rejected'].includes(prev.status) ? 'pending' : prev.status, under_review: ['draft', 'rejected'].includes(prev.status) ? prev.under_review : true } : prev)} />
        )}
      </div>
    </div>
  )
}
