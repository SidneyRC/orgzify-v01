// GOES IN: components/admin/OREV1-080-RaiseTicketModal.tsx
'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1081RecordSearchBox from '@/components/admin/OREV1-081-RecordSearchBox'
import { CREATE_SELECTABLE_STATUSES } from '@/lib/helpDeskStatusRules'

type Props = { onClose: () => void; onCreated: (ticket: any) => void }
const DRAFT_KEY = 'helpdesk_ticket_draft'
const REF_TYPES = ['entity', 'staff', 'customer']
const SOURCES = ['ticket_form', 'chat', 'email', 'phone']

export default function OREV1080RaiseTicketModal({ onClose, onCreated }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [referenceType, setReferenceType] = useState('entity')
  const [referenceId, setReferenceId] = useState<string | null>(null)
  const [categoryId, setCategoryId] = useState('')
  const [subCategoryId, setSubCategoryId] = useState('')
  const [source, setSource] = useState('ticket_form')
  const [statusCode, setStatusCode] = useState('new')
  const [followupDate, setFollowupDate] = useState('')
  const [message, setMessage] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [categories, setCategories] = useState<any[]>([])
  const [subCategories, setSubCategories] = useState<any[]>([])
  const [statuses, setStatuses] = useState<any[]>([])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) setMessage(saved)
    fetch('/admin/ecosystem/helpdesk/api/statuses').then(r => r.json()).then(j => setStatuses(j.data || []))
  }, [])

  useEffect(() => {
    const t = setTimeout(() => { if (message) localStorage.setItem(DRAFT_KEY, message) }, 1000)
    return () => clearTimeout(t)
  }, [message])

  useEffect(() => {
    fetch(`/admin/ecosystem/helpdesk/api/categories?reference_type=${referenceType}`)
      .then(r => r.json()).then(j => { setCategories(j.categories || []); setSubCategories(j.subCategories || []) })
  }, [referenceType])

  const filteredSubs = subCategories.filter((s: any) => s.parent_id === categoryId)
  const hasSubs = filteredSubs.length > 0
  const effectiveSubCategoryId = hasSubs ? subCategoryId : categoryId

  const handleSubmit = async () => {
    if (!categoryId || !effectiveSubCategoryId) { toast.error('Pick a Category' + (hasSubs ? ' and Sub-category' : '')); return }
    if (statusCode === 'pending' && !followupDate) { toast.error('Next Follow-up Date required for Pending'); return }
    setSaving(true)
    const res = await fetch('/admin/ecosystem/helpdesk/api', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference_type: referenceType, reference_id: referenceId, category_id: categoryId, sub_category_id: effectiveSubCategoryId, source, status_code: statusCode, next_followup_date: followupDate || undefined, message })
    })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Failed to create ticket'); setSaving(false); return }

    if (file) {
      const formData = new FormData()
      formData.append('file', file); formData.append('ticket_id', json.data.id); formData.append('visibility', 'external')
      await fetch('/admin/ecosystem/helpdesk/api/attachments', { method: 'POST', body: formData })
    }

    setSaving(false)
    localStorage.removeItem(DRAFT_KEY)
    toast.success(`Ticket ${json.data.ticket_number} raised`)
    onCreated(json.data)
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto p-6 flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Raise a Ticket</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">This ticket is about</label>
          <select value={referenceType} onChange={e => { setReferenceType(e.target.value); setReferenceId(null) }}
            className="h-10 px-3 text-sm border border-gray-200 rounded-xl" style={{ borderRadius: radius }}>
            {REF_TYPES.map(t => <option key={t} value={t}>{t[0].toUpperCase() + t.slice(1)}</option>)}
          </select>
        </div>

        <OREV1081RecordSearchBox referenceType={referenceType} onSelect={r => setReferenceId(r?.id || null)} />

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Category</label>
          <select value={categoryId} onChange={e => { setCategoryId(e.target.value); setSubCategoryId('') }}
            className="h-10 px-3 text-sm border border-gray-200 rounded-xl" style={{ borderRadius: radius }}>
            <option value="">Select…</option>
            {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </div>

        {(!categoryId || hasSubs) && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Sub-category</label>
            <select value={subCategoryId} onChange={e => setSubCategoryId(e.target.value)} disabled={!categoryId}
              className="h-10 px-3 text-sm border border-gray-200 rounded-xl disabled:opacity-50" style={{ borderRadius: radius }}>
              <option value="">Select…</option>
              {filteredSubs.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        )}

        <div className="flex gap-3">
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-gray-500">Source</label>
            <select value={source} onChange={e => setSource(e.target.value)} className="h-10 px-3 text-sm border border-gray-200 rounded-xl" style={{ borderRadius: radius }}>
              {SOURCES.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 flex-1">
            <label className="text-xs text-gray-500">Status</label>
            <select value={statusCode} onChange={e => setStatusCode(e.target.value)} className="h-10 px-3 text-sm border border-gray-200 rounded-xl" style={{ borderRadius: radius }}>
              {statuses.filter((s: any) => CREATE_SELECTABLE_STATUSES.includes(s.code)).map((s: any) => <option key={s.code} value={s.code}>{s.label}</option>)}
            </select>
          </div>
        </div>

        {statusCode === 'pending' && (
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Next Follow-up Date</label>
            <input type="date" value={followupDate} onChange={e => setFollowupDate(e.target.value)} className="h-10 px-3 text-sm border border-gray-200 rounded-xl" style={{ borderRadius: radius }} />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <label className="text-xs text-gray-500">Attachments</label>
            <label style={{ borderRadius: radius }} className="text-xs text-blue-700 border border-blue-200 px-3 py-1.5 cursor-pointer hover:bg-blue-50">
              + Attach Image
              <input type="file" accept="image/*" className="hidden" onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          {!file && <p className="text-xs text-gray-400">No attachments yet.</p>}
          {file && (
            <div className="grid grid-cols-3 gap-2">
              <div className="relative group">
                <img src={URL.createObjectURL(file)} alt={file.name} className="w-full h-20 object-cover rounded-xl border border-gray-100" />
                <button onClick={() => setFile(null)} title="Remove"
                  className="absolute -top-1 -right-1 bg-white border border-gray-200 rounded-full w-5 h-5 text-xs text-red-500 opacity-0 group-hover:opacity-100">✕</button>
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-xs text-gray-500">Notes</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={4}
            placeholder="Type notes here — auto-saved as you type…" className="px-3 py-2 text-sm border border-gray-200 rounded-xl" />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-4 py-2">Cancel</button>
          <button onClick={handleSubmit} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2 disabled:opacity-50">{saving ? 'Saving…' : 'Raise Ticket'}</button>
        </div>
      </div>
    </div>
  )
}
