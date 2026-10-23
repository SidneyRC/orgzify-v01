// THIS FILE GOES IN: components/admin/OREV1-143B-EventCategoryFormModal.tsx (NEW FILE)
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

const API = '/admin/master/event-categories/api'

type Props = {
  editing: any; l1Options: { id: string; name: string }[]; readOnly: boolean
  onClose: () => void; onSaved: () => void
}

export default function OREV1143BEventCategoryFormModal({ editing, l1Options, readOnly, onClose, onSaved }: Props) {
  const { theme } = useTheme()
  const [name, setName] = useState(editing?.name || '')
  const [level, setLevel] = useState(editing?.level || 1)
  const [parentId, setParentId] = useState(editing?.parent_id || '')
  const [displayOrder, setDisplayOrder] = useState(editing?.display_order ?? 0)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }

  const handleSave = async () => {
    if (!name.trim()) { setError('Name is required'); return }
    if (level === 2 && !parentId) { setError('Parent category is required for a Sub-Category'); return }
    setSaving(true); setError('')
    const body: any = { name: name.trim(), level, parent_id: level === 2 ? parentId : null, display_order: Number(displayOrder) || 0 }
    const res = await fetch(API, {
      method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing ? { ...body, id: editing.id } : body)
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { setError(json.error); return }
    toast.success(editing ? 'Category updated.' : 'Category added.')
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-white w-full max-w-md p-6 flex flex-col gap-4" style={{ borderRadius: radius }}>
        <h2 className="text-base font-semibold text-gray-800">{readOnly ? 'View' : editing ? 'Edit' : 'Add'} Category</h2>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Level</label>
          <select disabled={readOnly || !!editing} value={level} onChange={e => { setLevel(Number(e.target.value)); setParentId('') }}
            className="h-10 px-3 text-sm focus:outline-none disabled:opacity-50" style={inputStyle}>
            <option value={1}>Level 1 — Category</option>
            <option value={2}>Level 2 — Sub-Category</option>
          </select>
        </div>

        {level === 2 && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Parent Category</label>
            <select disabled={readOnly} value={parentId} onChange={e => setParentId(e.target.value)} className="h-10 px-3 text-sm focus:outline-none disabled:opacity-50" style={inputStyle}>
              <option value="">Select parent…</option>
              {l1Options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Name</label>
          <input disabled={readOnly} value={name} onChange={e => setName(e.target.value)} placeholder="Category name" className="h-10 px-3 text-sm focus:outline-none disabled:opacity-50" style={inputStyle} />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Display Order</label>
          <input disabled={readOnly} type="number" value={displayOrder} onChange={e => setDisplayOrder(e.target.value)} className="h-10 px-3 text-sm focus:outline-none disabled:opacity-50" style={inputStyle} />
        </div>

        {error && <p className="text-xs text-red-500">{error}</p>}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-4 py-2">Close</button>
          {!readOnly && <button onClick={handleSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2 disabled:opacity-50">{saving ? 'Saving…' : 'Save'}</button>}
        </div>
      </div>
    </div>
  )
}
