'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import type { AuthorisedPerson } from '@/components/admin/OREV1-055-EntityRegistration'

type Props = {
  person: AuthorisedPerson | null
  entityTypeId: string
  onEntityTypeChange: (id: string) => void
  open: boolean
  onToggle: () => void
  onNext: () => void
  readOnly?: boolean
  canEdit?: boolean
  onEnableEdit?: () => void
  closeUrl: string
}

const API = '/biz/register/api'

export default function OREV1056EntitySection1({ person, entityTypeId, onEntityTypeChange, open, onToggle, onNext, readOnly, canEdit, onEnableEdit, closeUrl }: Props) {
  const { theme } = useTheme()
  const router = useRouter()
  const radius = theme?.global_border_radius || '12px'
  const readOnlyStyle = { backgroundColor: theme?.btn_disabled_bg || '#f3f4f6', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [entityTypes, setEntityTypes] = useState<{ id: string; name: string }[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`${API}?type=entity_types`).then(r => r.json()).then(j => setEntityTypes(j.data || []))
  }, [])

  const isComplete = !!entityTypeId

  const handleClose = () => router.push(closeUrl)

  const readField = (label: string, value: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label}</label>
      <input value={value || '—'} disabled className="h-10 px-3 text-sm text-gray-500" style={readOnlyStyle} />
    </div>
  )

  const handleNext = () => {
    if (!entityTypeId) { setError('Please select Entity Type'); return }
    setError('')
    onNext()
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {isComplete ? '✓' : '1'}
          </span>
          <p className="text-sm font-semibold text-gray-700">Contact Person Details</p>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

{open && (
        <div className={`px-6 pb-6 flex flex-col gap-4 border-t border-gray-50 pt-5 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
          <p className="text-xs text-gray-400">Pulled automatically from your profile — cannot be edited here.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {readField('Name', person?.full_name || '')}
            {readField('Contact number', person?.mobile || '')}
            {readField('WhatsApp number', person?.whatsapp_number || '')}
            {readField('Email', person?.email || '')}
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Entity Type <span className="text-red-500">*</span></label>
            <select value={entityTypeId} onChange={e => onEntityTypeChange(e.target.value)}
              className="h-10 px-3 text-sm focus:outline-none w-full sm:w-1/2" style={inputStyle}>
              <option value="">Select…</option>
              {entityTypes.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {error && <span className="text-xs text-red-500">{error}</span>}
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
              <button onClick={handleClose} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
              <button onClick={handleNext} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">Next: Company Details →</button>
            </div>
            <div className="flex gap-2 sm:hidden">
              <button onClick={handleNext} style={primaryBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 transition">Next: Company Details →</button>
              <button onClick={handleClose} style={outlineBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
            </div>
          </div>
          )}
        </div>
      )}
    </div>
  )
}
