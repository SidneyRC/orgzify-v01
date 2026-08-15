// THIS FILE GOES IN: components/shared/OREV1-102-EventSection2.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1102BRichTextEditor from '@/components/shared/OREV1-102B-RichTextEditor'
import OREV1059ConfirmModal from '@/components/admin/OREV1-059-ConfirmModal'
import type { EventDraft } from '@/components/shared/OREV1-100-EventRegistration'

const API = '/biz/events/api'
const DEFAULT_TC = '<p>By participating in this event, attendees agree to follow the organiser\'s rules and safety guidelines. Entry fees, once paid, are subject to the refund setting chosen for this event. The organiser is responsible for all on-ground arrangements.</p>'

type Props = { event: EventDraft | null; open: boolean; onToggle: () => void; onSaved: (updated: EventDraft) => void; onBack: () => void; closeUrl: string }

export default function OREV1102EventSection2({ event, open, onToggle, onSaved, onBack, closeUrl }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [description, setDescription] = useState(event?.description || '')
  const [terms, setTerms] = useState(event?.terms_conditions || DEFAULT_TC)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const isLocked = event?.status === 'pending'
  const wasActive = event?.status === 'active'

  const plainLength = (html: string) => html.replace(/<[^>]*>/g, '').trim().length
  const handleClose = () => router.push(closeUrl)

  const save = async () => {
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_section2', id: event?.id, description, terms_conditions: terms })
    })
    return res.json()
  }

  const handleSave = async () => {
    if (isLocked) return
    if (plainLength(description) === 0) { setError('Required'); return }
    setError('')
    setSaving(true)
    const json = await save()
    setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success(wasActive ? 'Changes sent for re-verification — your event stays live in the meantime.' : 'Saved')
    onSaved(json.data)
  }

  const handleSaveDraft = async () => {
    if (isLocked) { handleClose(); return }
    if (plainLength(description) === 0) { handleClose(); return }
    setSaving(true)
    const json = await save()
    setSaving(false)
    if (json.error) { toast.error(json.error); return }
    if (wasActive) toast.success('Changes sent for re-verification.')
    handleClose()
  }

  const isComplete = !!event?.description

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{isComplete ? '✓' : '2'}</span>
          <p className="text-sm font-semibold text-gray-700">Description &amp; Terms</p>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        <div className="px-6 pb-6 flex flex-col gap-5 border-t border-gray-50 pt-5">
          {isLocked && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl px-4 py-3 text-xs text-yellow-700">
              This event is awaiting Admin review and can't be edited right now.
            </div>
          )}
          <fieldset disabled={isLocked} className="flex flex-col gap-5 disabled:opacity-60">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Description <span className="text-red-500">*</span></label>
            <OREV1102BRichTextEditor value={description} onChange={setDescription} theme={theme} radius={radius} />
            {error && <span className="text-xs text-red-500">{error}</span>}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Terms &amp; Conditions</label>
            <OREV1102BRichTextEditor value={terms} onChange={setTerms} theme={theme} radius={radius} />
            <span className="text-xs text-gray-400">Pre-filled with standard terms — edit as needed for your event.</span>
          </div>
          </fieldset>

          <div className="pt-2">
            <div className="hidden sm:flex sm:justify-end sm:gap-2">
              <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">← Back</button>
              <button onClick={() => setShowCloseConfirm(true)} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
              {!isLocked && <button onClick={handleSaveDraft} disabled={saving} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">Save to Draft</button>}
              {!isLocked && <button onClick={handleSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? 'Saving…' : 'Save & Continue'}</button>}
            </div>
            <div className="flex gap-1.5 sm:hidden">
              <button onClick={onBack} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">← Back</button>
              <button onClick={() => setShowCloseConfirm(true)} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
              {!isLocked && <button onClick={handleSaveDraft} disabled={saving} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">Draft</button>}
              {!isLocked && <button onClick={handleSave} disabled={saving} style={primaryBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? '…' : 'Save'}</button>}
            </div>
          </div>
        </div>
      )}

      <OREV1059ConfirmModal open={showCloseConfirm} title="Leave without saving?" message="Any unsaved changes on this section will be lost." onCancel={() => setShowCloseConfirm(false)} onConfirm={handleClose} />
    </div>
  )
}
