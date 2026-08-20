// THIS FILE GOES IN: components/shared/OREV1-115-EventStepReview.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'
import toast from 'react-hot-toast'
import OREV1115BReviewInfoSection from '@/components/shared/OREV1-115B-ReviewInfoSection'
import OREV1115CReviewMediaSection from '@/components/shared/OREV1-115C-ReviewMediaSection'
import OREV1115GReviewSponsorsArtistsSocial from '@/components/shared/OREV1-115G-ReviewSponsorsArtistsSocial'
import OREV1115DReviewScheduleTicketsSection from '@/components/shared/OREV1-115D-ReviewScheduleTicketsSection'
import OREV1115EReviewBookingMethodSection from '@/components/shared/OREV1-115E-ReviewBookingMethodSection'
import OREV1115FReviewSubmitConfirm from '@/components/shared/OREV1-115F-ReviewSubmitConfirm'
import type { EventDraft } from '@/components/shared/OREV1-100-EventRegistration'

type StepNumbers = { info: number; additional: number; media: number; schedule: number; booking: number }
type Props = {
  event: EventDraft; locked: boolean; steps: StepNumbers; theme: any
  onEditStep: (step: number) => void; onBack: () => void; onClose: () => void; onSubmitted: () => void
}

export default function OREV1115EventStepReview({ event, locked, steps, theme, onEditStep, onBack, onClose, onSubmitted }: Props) {
  const [confirming, setConfirming] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const radius = theme?.global_border_radius || '12px'
  const outline = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const primary = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }

  const doSubmit = async () => {
    setSubmitting(true)
    const j = await (await fetch('/biz/events/api', { method: 'POST', body: JSON.stringify({ action: 'submit_for_approval', id: event.id }) })).json()
    setSubmitting(false)
    if (j.error) { toast.error(j.error); return }
    setConfirming(false)
    toast.success('Event submitted for review')
    onSubmitted()
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-semibold text-gray-700">Review &amp; Submit</p>
      <p className="text-xs" style={{ color: theme?.color_text_muted || '#9ca3af' }}>
        Check every section below. Use Edit to fix anything before submitting for Admin approval.
      </p>
      {event.status === 'pending' && (
        <div className="rounded-xl px-4 py-3 text-sm" style={{ backgroundColor: '#fffbeb', color: '#b45309', borderRadius: radius }}>
          Your event has been submitted and is with our team for review. This usually takes within 48 hours — we'll notify you as soon as it's approved.
        </div>
      )}

      <OREV1115BReviewInfoSection event={event} onEditInfo={() => onEditStep(steps.info)} onEditAdditional={() => onEditStep(steps.additional)} theme={theme} />
      <OREV1115CReviewMediaSection eventId={event.id} onEdit={() => onEditStep(steps.media)} theme={theme} />
      <OREV1115GReviewSponsorsArtistsSocial eventId={event.id} onEdit={() => onEditStep(steps.media)} theme={theme} />
      <OREV1115DReviewScheduleTicketsSection eventId={event.id} onEdit={() => onEditStep(steps.schedule)} theme={theme} />
      <OREV1115EReviewBookingMethodSection eventId={event.id} onEdit={() => onEditStep(steps.booking)} theme={theme} />

      <div className="hidden sm:flex sm:justify-end sm:gap-2 mt-2">
        <button onClick={onBack} style={outline} className="px-4 py-2 text-sm">← Back</button>
        <button onClick={onClose} style={outline} className="px-4 py-2 text-sm">✕ Close</button>
        {event.status === 'draft' && <button onClick={() => setConfirming(true)} style={primary} className="px-4 py-2 text-sm font-medium">Submit for Approval</button>}
      </div>
      <div className="flex gap-1.5 sm:hidden mt-2">
        <button onClick={onBack} style={outline} className="flex-1 py-2 text-sm">← Back</button>
        <button onClick={onClose} style={outline} className="flex-1 py-2 text-sm">✕ Close</button>
        {event.status === 'draft' && <button onClick={() => setConfirming(true)} style={primary} className="flex-1 py-2 text-sm font-medium">Submit</button>}
      </div>

      {confirming && <OREV1115FReviewSubmitConfirm submitting={submitting} onConfirm={doSubmit} onCancel={() => setConfirming(false)} theme={theme} />}
    </div>
  )
}