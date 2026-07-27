'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1059ConfirmModal from '@/components/admin/OREV1-059-ConfirmModal'
import type { EntityDraft } from '@/components/admin/OREV1-055-EntityRegistration'

const API = '/biz/register/api'

type KycRule = {
  id: string; document_type_id: string
  needs_number: boolean; is_conditional: boolean
  document_types: { name: string; display_order: number; number_length: number | null }
}
type Answer = { document_number: string; has_document: boolean }

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

export default function OREV1058EntitySection3({ entity, open, onToggle, onSaved, onBack, readOnly, canEdit, onEnableEdit, closeUrl }: Props) {
  const { theme } = useTheme()
  const router = useRouter()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [rules, setRules] = useState<KycRule[]>([])
  const [notMapped, setNotMapped] = useState(false)
  const [answers, setAnswers] = useState<Record<string, Answer>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  useEffect(() => {
    if (!entity?.id) return
    setLoading(true)
      fetch(`${API}?type=kyc_rules&entity_id=${entity.id}`).then(r => r.json()).then(j => {
      setNotMapped(!!j.not_mapped)
      const loadedRules: KycRule[] = j.data || []
      setRules(loadedRules)
      const map: Record<string, Answer> = {}
      loadedRules.forEach(r => {
        const existing = (j.existing || []).find((e: any) => e.document_type_id === r.document_type_id)
        map[r.document_type_id] = {
          document_number: existing?.document_number || '',
          has_document: existing?.has_document ?? !r.is_conditional
        }
      })
      setAnswers(map)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [entity?.id])

  const isComplete = rules.length > 0 && rules.every(r => {
    const a = answers[r.document_type_id]
    const needsValue = r.needs_number && (!r.is_conditional || a?.has_document)
    return !needsValue || !!a?.document_number?.trim()
  })

  // Close: Owner (customer) always goes Home. Staff always goes to the
  // Admin list. View mode leaves immediately, no popup — editable mode's
  // popup (below) handles the unsaved-changes warning instead.
  const handleClose = () => router.push(closeUrl)

  const setAnswer = (docTypeId: string, patch: Partial<Answer>) => {
    setAnswers(prev => ({ ...prev, [docTypeId]: { ...prev[docTypeId], ...patch } }))
  }

  const validate = () => {
    const e: Record<string, string> = {}
    rules.forEach(r => {
      const a = answers[r.document_type_id]
      const needsValue = r.needs_number && (!r.is_conditional || a?.has_document)
      if (!needsValue) return
      const val = a?.document_number?.trim() || ''
      const len = r.document_types.number_length
      if (!val) e[r.document_type_id] = 'Required'
      else if (len && val.length !== len) e[r.document_type_id] = `Must be exactly ${len} characters`
    })
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSave = async (destination: 'next' | 'draft') => {
    if (!validate()) return
    setSaving(true)
    const answerList = rules.map(r => ({
      document_type_id: r.document_type_id,
      document_number: answers[r.document_type_id]?.document_number || '',
      has_document: r.is_conditional ? answers[r.document_type_id]?.has_document : null
    }))
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'save_section3', entity_id: entity?.id, answers: answerList })
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error('Failed to save'); return }
    toast.success('KYC details saved')
    if (destination === 'draft') { handleClose(); return }
    onSaved()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {isComplete ? '✓' : '3'}
          </span>
          <p className="text-sm font-semibold text-gray-700">KYC</p>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        loading ? (
          <div className="px-6 pb-6 pt-5 border-t border-gray-50"><p className="text-sm text-gray-400">Loading…</p></div>
        ) : (
        <div className={`px-6 pb-6 flex flex-col gap-5 border-t border-gray-50 pt-5 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>

          {rules.length === 0 && (
            <p className="text-sm text-gray-400">No KYC documents configured for this Entity Type and Country yet.</p>
          )}

          {rules.filter(r => r.is_conditional).map(r => {
            const a = answers[r.document_type_id] || { document_number: '', has_document: false }
            return (
              <div key={r.id + '-toggle'} className="flex items-center justify-between">
                <label className="text-xs text-gray-500">Do you have {r.document_types.name}?</label>
                <button type="button"
                  onClick={() => setAnswer(r.document_type_id, { has_document: !a.has_document, document_number: !a.has_document ? a.document_number : '' })}
                  className="relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0"
                  style={{ backgroundColor: a.has_document ? '#22c55e' : (theme?.input_disabled_bg || '#e5e7eb') }}>
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${a.has_document ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            )
          })}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {rules.filter(r => r.needs_number && (!r.is_conditional || answers[r.document_type_id]?.has_document)).map(r => {
              const a = answers[r.document_type_id] || { document_number: '', has_document: !r.is_conditional }
              return (
                <div key={r.id} className="flex flex-col gap-1">
                  <label className="text-xs text-gray-500">{r.document_types.name} Number <span className="text-red-500">*</span></label>
                  <input value={a.document_number} onChange={e => setAnswer(r.document_type_id, { document_number: e.target.value.replace(/[^a-zA-Z0-9]/g, '') })}
                    maxLength={r.document_types.number_length || undefined}
                    placeholder={`Enter ${r.document_types.name} number`}
                    className="h-10 px-3 text-sm focus:outline-none"
                    style={inputStyle} />
                  {errors[r.document_type_id] && <span className="text-xs text-red-500">{errors[r.document_type_id]}</span>}
                </div>
              )
            })}
          </div>

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
              <button onClick={() => handleSave('draft')} disabled={saving} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">Save to Draft</button>
              <button onClick={() => handleSave('next')} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? 'Saving…' : '💾 Save KYC'}</button>
            </div>
            <div className="flex gap-1.5 sm:hidden">
              <button onClick={onBack} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">← Back</button>
              <button onClick={() => setShowCloseConfirm(true)} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
              <button onClick={() => handleSave('draft')} disabled={saving} style={outlineBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">Draft</button>
              <button onClick={() => handleSave('next')} disabled={saving} style={primaryBtn} className="flex-1 text-xs font-medium py-2 px-1 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? '…' : 'Save'}</button>
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
