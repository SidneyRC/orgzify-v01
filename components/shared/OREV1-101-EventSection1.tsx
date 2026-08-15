// THIS FILE GOES IN: components/shared/OREV1-101-EventSection1.tsx (REPLACES existing file)
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1059ConfirmModal from '@/components/admin/OREV1-059-ConfirmModal'
import type { EventDraft } from '@/components/shared/OREV1-100-EventRegistration'

const API = '/biz/events/api'
type Category = { id: string; parent_id: string | null; level: number; name: string }
type Props = { event: EventDraft | null; entityId: string; open: boolean; onToggle: () => void; onSaved: (updated: EventDraft) => void; closeUrl: string }

const FORMAT_OPTS = [
  { value: 'physical', label: 'Physical', note: 'Happens at a real venue — you\'ll pick the venue, date and time next.' },
  { value: 'virtual', label: 'Virtual', note: 'Happens online — you\'ll provide the access link and password instead of a venue.' },
]
const VISIBILITY_OPTS = [
  { value: 'public', label: 'Public', note: "Listed on Orgzify's public site for anyone to discover." },
  { value: 'private', label: 'Private', note: 'Hidden from public listings — visible only to people with the direct link.' },
]

export default function OREV1101EventSection1({ event, entityId, open, onToggle, onSaved, closeUrl }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const activeCard = { borderColor: theme?.btn_bg || '#1e3a8a', backgroundColor: theme?.badge_success_bg || '#eff6ff', borderRadius: radius }
  const inactiveCard = { borderColor: theme?.input_border || '#e5e7eb', backgroundColor: theme?.input_bg || '#fff', borderRadius: radius }

  const [categories, setCategories] = useState<Category[]>([])
  const [format, setFormat] = useState(event?.event_format || 'physical')
  const [name, setName] = useState(event?.name || '')
  const [categoryId, setCategoryId] = useState(event?.category_id || '')
  const [subCategoryId, setSubCategoryId] = useState(event?.sub_category_id || '')
  const [visibility, setVisibility] = useState(event?.visibility || 'public')
  const [minAge, setMinAge] = useState(event?.min_age?.toString() || '')
  const [refund, setRefund] = useState(event?.refund_allowed || false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const isLocked = event?.status === 'pending'
  const wasActive = event?.status === 'active'

  useEffect(() => { fetch(`${API}?type=categories`).then(r => r.json()).then(j => setCategories(j.data || [])) }, [])
  const topCategories = categories.filter(c => c.level === 1)
  const subCategories = categories.filter(c => c.level === 2 && c.parent_id === categoryId)

  const handleClose = () => router.push(closeUrl)

  const buildPayload = () => ({
    action: 'save_section1', id: event?.id, entity_id: entityId, event_format: format,
    name: name.trim(), category_id: categoryId || null, sub_category_id: subCategoryId || null,
    visibility, min_age: minAge ? parseInt(minAge) : null, refund_allowed: refund
  })

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Required'
    else if (name.length > 50) e.name = 'Max 50 characters'
    if (!categoryId) e.category = 'Required'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (isLocked) return
    if (!validate()) return
    setSaving(true)
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success(wasActive ? 'Changes sent for re-verification — your event stays live in the meantime.' : 'Saved')
    onSaved(json.data)
  }

  const handleSaveDraft = async () => {
    if (isLocked) { handleClose(); return }
    if (!name.trim()) { handleClose(); return }
    setSaving(true)
    const res = await fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success(wasActive ? 'Changes sent for re-verification.' : 'Saved to draft')
    setTimeout(handleClose, 600)
  }

  const isComplete = !!event?.name

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>{isComplete ? '✓' : '1'}</span>
          <p className="text-sm font-semibold text-gray-700">Event Information</p>
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
            <label className="text-xs text-gray-500">Event Format <span className="text-red-500">*</span></label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {FORMAT_OPTS.map(opt => (
                <button key={opt.value} type="button" disabled={isLocked} onClick={() => setFormat(opt.value)} style={format === opt.value ? activeCard : inactiveCard} className="text-left border p-3 transition">
                  <p className="text-sm font-semibold text-gray-700">{opt.label}</p>
                  <p className="text-xs mt-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{opt.note}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Event Name <span className="text-red-500">*</span></label>
            <input value={name} onChange={e => setName(e.target.value.slice(0, 50))} maxLength={50} placeholder="Enter event name" className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
            <span className="text-xs text-gray-400">{name.length}/50</span>
            {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
          </div>

          {event?.slug && (
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Slug</label>
              <input value={event.slug} disabled className="h-10 px-3 text-sm text-gray-400" style={inputStyle} />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Category <span className="text-red-500">*</span></label>
              <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId('') }} className="h-10 px-3 text-sm focus:outline-none" style={inputStyle}>
                <option value="">Select category</option>
                {topCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              {errors.category && <span className="text-xs text-red-500">{errors.category}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Sub-category</label>
              <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} disabled={!categoryId} className="h-10 px-3 text-sm focus:outline-none disabled:opacity-50" style={inputStyle}>
                <option value="">Select sub-category</option>
                {subCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Visibility</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {VISIBILITY_OPTS.map(opt => (
                <button key={opt.value} type="button" onClick={() => setVisibility(opt.value)} style={visibility === opt.value ? activeCard : inactiveCard} className="text-left border p-3 transition">
                  <p className="text-sm font-semibold text-gray-700">{opt.label}</p>
                  <p className="text-xs mt-1" style={{ color: theme?.color_text_muted || '#9ca3af' }}>{opt.note}</p>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-gray-500">Minimum Age (optional)</label>
              <input type="number" min={0} value={minAge} onChange={e => setMinAge(e.target.value)} placeholder="Leave blank for no restriction" className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
            </div>
            <div className="flex items-center justify-between sm:pt-5">
              <label className="text-xs text-gray-500">Refund Allowed</label>
              <button type="button" onClick={() => setRefund(!refund)} className="relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0" style={{ backgroundColor: refund ? '#22c55e' : (theme?.btn_disabled_bg || '#e5e7eb') }}>
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${refund ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>
          </fieldset>

          <div className="pt-2">
            <div className="hidden sm:flex sm:justify-end sm:gap-2">
              <button onClick={() => setShowCloseConfirm(true)} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
              {!isLocked && <button onClick={handleSaveDraft} disabled={saving} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">Save to Draft</button>}
              {!isLocked && <button onClick={handleSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? 'Saving…' : 'Save & Continue'}</button>}
            </div>
            <div className="flex gap-1.5 sm:hidden">
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
