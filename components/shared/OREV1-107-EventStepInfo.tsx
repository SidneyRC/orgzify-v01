// THIS FILE GOES IN: components/shared/OREV1-107-EventStepInfo.tsx (NEW FILE)
'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1107BLanguagePicker from '@/components/shared/OREV1-107B-LanguagePicker'
import type { EventDraft } from '@/components/shared/OREV1-100-EventRegistration'

const API = '/biz/events/api'
type Category = { id: string; parent_id: string | null; level: number; name: string }
type Props = { event: EventDraft | null; entityId: string; eventFormat: string; locked: boolean; onSaved: (updated: EventDraft) => void; onBack: () => void; onClose: () => void }

const VISIBILITY_OPTS = [
  { value: 'public', label: 'Public', note: "Listed on Orgzify's public site for anyone to discover." },
  { value: 'private', label: 'Private', note: 'Hidden from public listings — visible only to people with the direct link.' },
]

export default function OREV1107EventStepInfo({ event, entityId, eventFormat, locked, onSaved, onBack, onClose }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const activeCard = { borderColor: theme?.btn_bg || '#1e3a8a', backgroundColor: theme?.badge_success_bg || '#eff6ff', borderRadius: radius }
  const inactiveCard = { borderColor: theme?.input_border || '#e5e7eb', backgroundColor: theme?.input_bg || '#fff', borderRadius: radius }

  const [categories, setCategories] = useState<Category[]>([])
  const [name, setName] = useState(event?.name || '')
  const [categoryId, setCategoryId] = useState(event?.category_id || '')
  const [subCategoryId, setSubCategoryId] = useState(event?.sub_category_id || '')
  const [languages, setLanguages] = useState<string[]>((event as any)?.languages || [])
  const [visibility, setVisibility] = useState(event?.visibility || 'public')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  useEffect(() => { fetch(`${API}?type=categories`).then(r => r.json()).then(j => setCategories(j.data || [])) }, [])
  const topCategories = categories.filter(c => c.level === 1)
  const subCategories = categories.filter(c => c.level === 2 && c.parent_id === categoryId)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!name.trim()) e.name = 'Required'
    else if (name.length > 50) e.name = 'Max 50 characters'
    if (!categoryId) e.category = 'Required'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_step2_info', id: event?.id, entity_id: entityId, event_format: eventFormat,
        name: name.trim(), category_id: categoryId || null, sub_category_id: subCategoryId || null, languages, visibility
      })
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success(event ? (event.status === 'active' ? 'Changes sent for re-verification' : 'Saved') : 'Saved')
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
        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Event Name <span className="text-red-500">*</span></label>
          <input value={name} onChange={e => setName(e.target.value.slice(0, 50))} maxLength={50} placeholder="Enter event name" className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
          <span className="text-xs text-gray-400">{name.length}/50</span>
          {errors.name && <span className="text-xs text-red-500">{errors.name}</span>}
        </div>

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
          <label className="text-xs text-gray-500">Language(s)</label>
          <OREV1107BLanguagePicker value={languages} onChange={setLanguages} inputStyle={inputStyle} />
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
      </fieldset>

      <div className="flex justify-end gap-2">
        <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">← Back</button>
        <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition">✕ Close</button>
        {!locked && <button onClick={handleSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 transition disabled:opacity-50">{saving ? 'Saving…' : 'Continue'}</button>}
      </div>
    </div>
  )
}
