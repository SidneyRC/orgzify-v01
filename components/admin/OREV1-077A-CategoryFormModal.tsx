// GOES IN: components/admin/OREV1-077A-CategoryFormModal.tsx
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

type L1Option = { id: string; name: string }
type Props = {
  editing: { id: string; name: string; level: number; parent_id: string | null; audience?: string } | null
  l1Options: L1Option[]
  readOnly?: boolean
  onClose: () => void
  onSaved: () => void
}

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'All' }, { value: 'super_admin', label: 'Super Admin' }, { value: 'staff', label: 'Staff' },
  { value: 'customers', label: 'Customers' }, { value: 'entity', label: 'Entity' }, { value: 'entity_staff', label: 'Entity Staff' },
]

export default function OREV1077ACategoryFormModal({ editing, l1Options, readOnly = false, onClose, onSaved }: Props) {
  const { theme } = useTheme()
  const [name, setName] = useState(editing?.name || '')
  const [level, setLevel] = useState(editing?.level || 1)
  const [parentId, setParentId] = useState(editing?.parent_id || '')
  const [audience, setAudience] = useState(editing?.audience || 'all')
  const [saving, setSaving] = useState(false)

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Please enter a name.'); return }
    if (level === 2 && !parentId) { toast.error('Please select a parent category.'); return }
    setSaving(true)
    const payload = { id: editing?.id, name: name.trim(), level, parent_id: level === 1 ? null : parentId, audience: level === 2 ? audience : undefined }
    const method = editing ? 'PATCH' : 'POST'
    const res = await fetch('/admin/master/categories/api', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    setSaving(false)
    if (!res.ok || json.error) { toast.error(json.error || 'Something went wrong.'); return }
    toast.success(editing ? 'Category updated.' : 'Category added.')
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-sm p-6" style={{ borderRadius: radius }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: theme?.color_text_primary || '#111827' }}>
          {readOnly ? 'View Category' : editing ? 'Edit Category' : 'Add Category'}
        </h2>
        {!editing && (
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">Level</label>
            <select value={level} onChange={e => { setLevel(Number(e.target.value)); setParentId('') }} disabled={readOnly}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value={1}>Level 1 — Category</option>
              <option value={2}>Level 2 — Sub Category</option>
            </select>
          </div>
        )}
        {level === 2 && (
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">Parent Category</label>
            <select value={parentId} onChange={e => setParentId(e.target.value)} disabled={!!editing || readOnly}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              <option value="">Select…</option>
              {l1Options.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </div>
        )}
        {level === 2 && (
          <div className="mb-3">
            <label className="text-xs text-gray-500 mb-1 block">Audience</label>
            <select value={audience} onChange={e => setAudience(e.target.value)} disabled={readOnly}
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm">
              {AUDIENCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </div>
        )}
        <div className="mb-5">
          <label className="text-xs text-gray-500 mb-1 block">Name</label>
          <input value={name} onChange={e => setName(e.target.value)} maxLength={100} disabled={readOnly}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm" />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-4 py-2">Close</button>
          {!readOnly && (
            <button onClick={handleSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2 disabled:opacity-50">
              {saving ? 'Saving…' : 'Save'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
