'use client'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1059ConfirmModal from '@/components/admin/OREV1-059-ConfirmModal'
import type { EntityDraft } from '@/components/admin/OREV1-055-EntityRegistration'

const API = '/biz/register/api'
const UPLOAD_API = '/biz/register/upload'

type DocRule = {
  id: string; document_type_id: string
  needs_front_upload: boolean; needs_back_upload: boolean; is_conditional: boolean
  document_types: { name: string; display_order: number }
}
type Answer = { front_url: string; back_url: string }

type Props = {
  entity: EntityDraft | null
  open: boolean
  onToggle: () => void
  onSaved: () => void
  onBack: () => void
  readOnly?: boolean
  canEdit?: boolean
  onEnableEdit?: () => void
  closeUrl: string
}
export default function OREV1060EntitySection4({ entity, open, onToggle, onSaved, onBack, readOnly, canEdit, onEnableEdit, closeUrl }: Props) {
  const { theme } = useTheme()
  const router = useRouter()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const boxStyle = { border: `1px dashed ${theme?.input_border || '#d1d5db'}`, borderRadius: radius, backgroundColor: theme?.input_bg || '#fff' }

  const [rules, setRules] = useState<DocRule[]>([])
  const [notMapped, setNotMapped] = useState(false)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [uploading, setUploading] = useState<Record<string, boolean>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)
  const fileInputs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    if (!entity?.id) return
    setLoading(true)
    fetch(`${API}?type=kyc_rules&entity_id=${entity.id}`).then(r => r.json()).then(j => {
      setNotMapped(!!j.not_mapped)
      const applicable: DocRule[] = (j.data || []).filter((r: DocRule) => r.needs_front_upload || r.needs_back_upload)
      const map: Record<string, Answer> = {}
      const visible = applicable.filter(r => {
        const existing = (j.existing || []).find((e: any) => e.document_type_id === r.document_type_id)
        map[r.document_type_id] = { front_url: existing?.front_url || '', back_url: existing?.back_url || '' }
        return !r.is_conditional || existing?.has_document
      })
      setRules(visible)
      setAnswers(map)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [entity?.id])

  const isComplete = rules.length > 0 && rules.every(r => {
    const a = answers[r.document_type_id]
    return (!r.needs_front_upload || !!a?.front_url) && (!r.needs_back_upload || !!a?.back_url)
  })

  // Close: Owner (customer) always goes Home. Staff always goes to the
  // Admin list. View mode leaves immediately, no popup — editable mode's
  // popup (below) handles the unsaved-changes warning instead.
  const handleClose = () => router.push(closeUrl)

  const handleUpload = async (docTypeId: string, side: 'front' | 'back', file: File) => {
    const key = `${docTypeId}_${side}`
    setUploading(prev => ({ ...prev, [key]: true }))
    const fd = new FormData()
    fd.append('photo', file); fd.append('entity_id', entity!.id); fd.append('document_type_id', docTypeId); fd.append('side', side)
    const res = await fetch(UPLOAD_API, { method: 'POST', body: fd })
    const json = await res.json()
    setUploading(prev => ({ ...prev, [key]: false }))
    if (json.error) { toast.error(json.error); return }
    setAnswers(prev => ({ ...prev, [docTypeId]: { ...prev[docTypeId], [`${side}_url`]: `${json.url}?t=${Date.now()}` } }))
    setErrors(prev => ({ ...prev, [docTypeId]: '' }))
  }

  const handleRemove = async (docTypeId: string, side: 'front' | 'back') => {
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'remove_document_photo', entity_id: entity!.id, document_type_id: docTypeId, side })
    })
    const json = await res.json()
    if (json.error) { toast.error('Failed to remove'); return }
    setAnswers(prev => ({ ...prev, [docTypeId]: { ...prev[docTypeId], [`${side}_url`]: '' } }))
    toast.success('Photo removed')
  }

  const validate = () => {
    const e: Record<string, string> = {}
    rules.forEach(r => {
      const a = answers[r.document_type_id]
      if (r.needs_front_upload && !a?.front_url) e[r.document_type_id] = 'Front photo required'
      else if (r.needs_back_upload && !a?.back_url) e[r.document_type_id] = 'Back photo required'
    })
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleFinish = (destination: 'next' | 'draft') => {
    if (!validate()) { toast.error('Please upload all required document photos'); return }
    toast.success('Documents saved')
    if (destination === 'draft') { handleClose(); return }
    onSaved()
  }

  const uploadBox = (docTypeId: string, side: 'front' | 'back', label: string, url: string) => {
    const key = `${docTypeId}_${side}`
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs text-gray-500">{label} <span className="text-red-500">*</span></label>
        <div style={boxStyle} className="h-28 flex items-center justify-center overflow-hidden relative group">
          {uploading[key] ? (
            <span className="text-xs text-gray-400">Uploading…</span>
          ) : url ? (
            <>
              <img src={url} alt={label} className="w-full h-full object-cover cursor-pointer" onClick={() => fileInputs.current[key]?.click()} />
              <button type="button" onClick={() => handleRemove(docTypeId, side)}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-white shadow flex items-center justify-center text-gray-500 hover:text-red-500 text-xs leading-none">✕</button>
            </>
          ) : (
            <button type="button" onClick={() => fileInputs.current[key]?.click()}
              className="w-full h-full flex flex-col items-center justify-center gap-1.5 hover:opacity-70 transition">
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M12 12v9m0-9l-3 3m3-3l3 3" />
              </svg>
              <span className="text-xs text-gray-400">Upload photo</span>
            </button>
          )}
        </div>
        <input ref={el => { fileInputs.current[key] = el }} type="file" accept="image/*" className="hidden"
          onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(docTypeId, side, f); e.target.value = '' }} />
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {isComplete ? '✓' : '4'}
          </span>
          <p className="text-sm font-semibold text-gray-700">Document Upload</p>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        loading ? (
          <div className="px-6 pb-6 pt-5 border-t border-gray-50"><p className="text-sm text-gray-400">Loading…</p></div>
        ) : (
        <div className={`px-6 pb-6 flex flex-col gap-5 border-t border-gray-50 pt-5 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
         {rules.length === 0 && <p className="text-sm text-gray-400">No document photos required for this Entity.</p>}

          {rules.map(r => (
            <div key={r.id} className="flex flex-col gap-2">
              <p className="text-xs font-semibold text-gray-600">{r.document_types.name}</p>
              <div className="grid grid-cols-2 gap-4">
                {r.needs_front_upload && uploadBox(r.document_type_id, 'front', 'Front', answers[r.document_type_id]?.front_url)}
                {r.needs_back_upload && uploadBox(r.document_type_id, 'back', 'Back', answers[r.document_type_id]?.back_url)}
              </div>
              {errors[r.document_type_id] && <span className="text-xs text-red-500">{errors[r.document_type_id]}</span>}
            </div>
          ))}

          {readOnly ? (
            <div className="pt-2 flex justify-end gap-2" style={{ pointerEvents: 'auto' }}>
              {canEdit && (
                <button onClick={onEnableEdit} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✎ Edit</button>
              )}
              <button onClick={handleClose} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
            </div>
          ) : (
          <div className="pt-2">
            <div className="hidden sm:flex sm:justify-end sm:gap-2">
              <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">← Back</button>
              <button onClick={() => setShowCloseConfirm(true)} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
              <button onClick={() => handleFinish('draft')} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">Save to Draft</button>
              <button onClick={() => handleFinish('next')} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">💾 Save Documents</button>
            </div>
            <div className="flex gap-1.5 sm:hidden">
              <button onClick={onBack} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">← Back</button>
              <button onClick={() => setShowCloseConfirm(true)} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
              <button onClick={() => handleFinish('draft')} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">Draft</button>
              <button onClick={() => handleFinish('next')} style={primaryBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">Save</button>
            </div>
          </div>
          )}
        </div>
        )
      )}

      <OREV1059ConfirmModal
        open={showCloseConfirm}
        title="Leave without saving?"
        message="Any unsaved changes on this section will be lost."
        onCancel={() => setShowCloseConfirm(false)}
        onConfirm={handleClose}
      />
    </div>
  )
}
