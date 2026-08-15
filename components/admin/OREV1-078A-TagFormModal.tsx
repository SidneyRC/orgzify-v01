// GOES IN: components/admin/OREV1-078A-TagFormModal.tsx
'use client'
import { useState } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

type Props = { editing: { id: string; name: string } | null; readOnly?: boolean; onClose: () => void; onSaved: () => void }

export default function OREV1078ATagFormModal({ editing, readOnly = false, onClose, onSaved }: Props) {
  const { theme } = useTheme()
  const [name, setName] = useState(editing?.name || '')
  const [saving, setSaving] = useState(false)
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const handleSave = async () => {
    if (!name.trim()) { toast.error('Please enter a name.'); return }
    setSaving(true)
    const payload = { id: editing?.id, name: name.trim() }
    const method = editing ? 'PATCH' : 'POST'
    const res = await fetch('/admin/master/event-tags-format/api', { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    setSaving(false)
    if (!res.ok || json.error) { toast.error(json.error || 'Something went wrong.'); return }
    toast.success(editing ? 'Tag updated.' : 'Tag added.')
    onSaved()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white w-full max-w-sm p-6" style={{ borderRadius: radius }}>
        <h2 className="text-base font-semibold mb-4" style={{ color: theme?.color_text_primary || '#111827' }}>
          {readOnly ? 'View Tag' : editing ? 'Edit Tag' : 'Add Tag'}
        </h2>
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
