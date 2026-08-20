// THIS FILE GOES IN: components/shared/OREV1-108-EventStepAdditional.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1102BRichTextEditor from '@/components/shared/OREV1-102B-RichTextEditor'
import OREV1108BTagPicker from '@/components/shared/OREV1-108B-TagPicker'
import type { EventDraft } from '@/components/shared/OREV1-100-EventRegistration'

const API = '/biz/events/api'
const DEFAULT_TC = '<p>By participating in this event, attendees agree to follow the organiser\'s rules and safety guidelines. Entry fees, once paid, are subject to the refund setting chosen for this event. The organiser is responsible for all on-ground arrangements.</p>'

type Props = { event: EventDraft | null; locked: boolean; onSaved: (updated: EventDraft) => void; onBack: () => void; onClose: () => void }

export default function OREV1108EventStepAdditional({ event, locked, onSaved, onBack, onClose }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [minAge, setMinAge] = useState(event?.min_age?.toString() || '')
  const [duration, setDuration] = useState((event as any)?.event_duration_minutes?.toString() || '')
  const [refund, setRefund] = useState(event?.refund_allowed ?? true)
  const [description, setDescription] = useState(event?.description || '')
  const [terms, setTerms] = useState(event?.terms_conditions || DEFAULT_TC)
  const [tags, setTags] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState('')
  const [tagError, setTagError] = useState('')
  const [minAgeError, setMinAgeError] = useState('')
  const [durationError, setDurationError] = useState('')
  const [termsError, setTermsError] = useState('')
  const [saving, setSaving] = useState(false)

  const plainLength = (html: string) => html.replace(/<[^>]*>/g, '').trim().length

  const handleSave = async () => {
    let hasError = false
    if (!minAge) { setMinAgeError('Required'); hasError = true } else { setMinAgeError('') }
    if (!duration) { setDurationError('Required'); hasError = true } else { setDurationError('') }
    if (plainLength(description) === 0) { setError('Required'); hasError = true } else { setError('') }
    if (tags.length === 0) { setTagError('Select at least 1 tag'); hasError = true } else { setTagError('') }
    if (plainLength(terms) === 0) { setTermsError('Required'); hasError = true } else { setTermsError('') }
    if (hasError) return
    setSaving(true)
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_step3_additional', id: event?.id,
        min_age: minAge ? parseInt(minAge) : null, event_duration_minutes: duration ? parseInt(duration) : null,
        refund_allowed: refund, description, terms_conditions: terms, tag_ids: tags.map(t => t.id)
      })
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success(event?.status === 'active' ? 'Changes sent for re-verification' : 'Saved')
    onSaved(json.data)
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {locked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700">
          This event is awaiting Admin review and can't be edited right now.
        </div>
      )}
      <fieldset disabled={locked} className="flex flex-col gap-5 disabled:opacity-60">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Minimum Age <span className="text-red-500">*</span></label>
            <input type="number" min={0} value={minAge} onChange={e => setMinAge(e.target.value)} placeholder="e.g. 18" className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
            {minAgeError && <span className="text-xs text-red-500">{minAgeError}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Event Duration (minutes) <span className="text-red-500">*</span></label>
            <input type="number" min={0} value={duration} onChange={e => setDuration(e.target.value)} placeholder="e.g. 120" className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
            {durationError && <span className="text-xs text-red-500">{durationError}</span>}
          </div>
          <div className="flex items-center justify-between sm:pt-5">
            <label className="text-xs text-gray-500">Refund Allowed</label>
            <button type="button" onClick={() => setRefund(!refund)} className="relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0" style={{ backgroundColor: refund ? '#22c55e' : (theme?.btn_disabled_bg || '#e5e7eb') }}>
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${refund ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>
        </div>

        <OREV1108BTagPicker eventId={event?.id} locked={locked} theme={theme} value={tags} onChange={setTags} error={tagError} />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Description <span className="text-red-500">*</span></label>
          <OREV1102BRichTextEditor value={description} onChange={setDescription} theme={theme} radius={radius} />
          {error && <span className="text-xs text-red-500">{error}</span>}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Terms &amp; Conditions <span className="text-red-500">*</span></label>
          <OREV1102BRichTextEditor value={terms} onChange={setTerms} theme={theme} radius={radius} />
          <span className="text-xs text-gray-400">Pre-filled with standard terms — edit as needed for your event.</span>
          {termsError && <span className="text-xs text-red-500">{termsError}</span>}
        </div>
      </fieldset>

      <div className="flex justify-end gap-2">
        <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">← Back</button>
        <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">✕ Close</button>
        {!locked
          ? <button onClick={handleSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition disabled:opacity-50">{saving ? 'Saving…' : 'Continue'}</button>
          : <button onClick={() => onSaved(event as EventDraft)} style={primaryBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">Next →</button>}
      </div>
    </div>
  )
}