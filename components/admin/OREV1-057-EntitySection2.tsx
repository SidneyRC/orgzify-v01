'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1047DAddressBlock, { emptyAddress, type AddressData } from '@/components/admin/OREV1-047D-AddressBlock'
import OREV1059ConfirmModal from '@/components/admin/OREV1-059-ConfirmModal'
import type { EntityDraft } from '@/components/admin/OREV1-055-EntityRegistration'
import { ensurePincodeSaved, getLocationNames } from '@/lib/addressHelpers'

const API = '/biz/register/api'

type Props = {
  entity: EntityDraft | null
  entityTypeId: string
  open: boolean
  onToggle: () => void
  onSaved: (entity: EntityDraft) => void
  onBack: () => void
  readOnly?: boolean
  canEdit?: boolean
  onEnableEdit?: () => void
  closeUrl: string
}

export default function OREV1057EntitySection2({ entity, entityTypeId, open, onToggle, onSaved, onBack, readOnly, canEdit, onEnableEdit, closeUrl }: Props) {
  const { theme } = useTheme()
  const router = useRouter()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [legalName, setLegalName] = useState(entity?.legal_name || '')
  const [displayName, setDisplayName] = useState(entity?.display_name || '')
  const [reg, setReg] = useState<AddressData>(emptyAddress())
  const [op, setOp] = useState<AddressData>(emptyAddress())
  const [same, setSame] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loadingAddr, setLoadingAddr] = useState(false)
  const [showCloseConfirm, setShowCloseConfirm] = useState(false)

  useEffect(() => {
    if (!entity?.id) return
    setLoadingAddr(true)
    fetch(`${API}?address_for=${entity.id}`).then(r => r.json()).then(async j => {
      const rows = j.data || []
      const regRow = rows.find((r: any) => r.address_type === 'registered')
      const opRow = rows.find((r: any) => r.address_type === 'operating')

      const idsToResolve = [regRow?.city, regRow?.district, regRow?.state, opRow?.city, opRow?.district, opRow?.state]
      const names = await getLocationNames(idsToResolve)

      if (regRow) setReg({
        pincode: regRow.pincode || '', area: regRow.area || '', line1: regRow.line1 || '', line2: regRow.line2 || '',
        city_id: regRow.city || '', city_name: names[regRow.city] || '', district_id: regRow.district || '', district_name: names[regRow.district] || '',
        state_id: regRow.state || '', state_name: names[regRow.state] || '', country_id: regRow.country_id || '', landmark: regRow.landmark || ''
      })
      if (opRow) {
        const isSame = regRow && opRow.pincode === regRow.pincode && opRow.line1 === regRow.line1
        setSame(isSame)
        if (!isSame) setOp({
          pincode: opRow.pincode || '', area: opRow.area || '', line1: opRow.line1 || '', line2: opRow.line2 || '',
          city_id: opRow.city || '', city_name: names[opRow.city] || '', district_id: opRow.district || '', district_name: names[opRow.district] || '',
          state_id: opRow.state || '', state_name: names[opRow.state] || '', country_id: opRow.country_id || '', landmark: opRow.landmark || ''
        })
      }
      setLoadingAddr(false)
    }).catch(() => setLoadingAddr(false))
  }, [entity?.id])

  const isComplete = !!entity?.legal_name && !!entity?.display_name

  // Close: Owner (customer) always goes Home. Staff always goes to the
  // Admin list. In view mode there's nothing to lose, so leave immediately —
  // the popup only appears from the editable buttons further down, where
  // unsaved changes are actually possible.
  const handleClose = () => router.push(closeUrl)

  const validate = () => {
    const e: Record<string, string> = {}
    if (!legalName.trim()) e.legal_name = 'Required'
    if (!displayName.trim()) e.display_name = 'Required'
    if (!reg.pincode.trim()) e.reg_pincode = 'Required'
    if (!reg.line1.trim()) e.reg_line1 = 'Required'
    if (!reg.city_id) e.reg_city_id = 'Required'
    if (!reg.state_id) e.reg_state_id = 'Required'
    if (!reg.country_id) e.reg_country_id = 'Required'
    if (!same) {
      if (!op.pincode.trim()) e.op_pincode = 'Required'
      if (!op.line1.trim()) e.op_line1 = 'Required'
      if (!op.city_id) e.op_city_id = 'Required'
      if (!op.state_id) e.op_state_id = 'Required'
      if (!op.country_id) e.op_country_id = 'Required'
    }
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSave = async (destination: 'next' | 'draft') => {
    if (!entityTypeId) { toast.error('Please select Entity Type in Section 1 first'); return }
    if (!validate()) return
    setSaving(true)
    await ensurePincodeSaved(reg)
    if (!same) await ensurePincodeSaved(op)
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'save_section2', id: entity?.id || null,
        entity_type_id: entityTypeId, legal_name: legalName, display_name: displayName,
        registered: reg, operating: same ? reg : op
      })
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error('Failed to save'); return }
    toast.success('Company Details & Address saved')
    if (destination === 'draft') { handleClose(); return }
    onSaved(json.data)
  }

  const field = (label: string, value: string, onChange: (v: string) => void, key: string, placeholder: string) => (
    <div className="flex flex-col gap-1">
      <label className="text-xs text-gray-500">{label} <span className="text-red-500">*</span></label>
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
      {errors[key] && <span className="text-xs text-red-500">{errors[key]}</span>}
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <button onClick={onToggle} className="w-full flex items-center justify-between px-6 py-4 text-left">
        <div className="flex items-center gap-2">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${isComplete ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
            {isComplete ? '✓' : '2'}
          </span>
          <p className="text-sm font-semibold text-gray-700">Company Details &amp; Address</p>
        </div>
        <span className="text-gray-400 text-sm">{open ? '▲' : '▼'}</span>
      </button>

      {open && (
        loadingAddr ? (
          <div className="px-6 pb-6 pt-5 border-t border-gray-50"><p className="text-sm text-gray-400">Loading…</p></div>
        ) : (
        <div className={`px-6 pb-6 flex flex-col gap-6 border-t border-gray-50 pt-5 ${readOnly ? 'opacity-60 pointer-events-none' : ''}`}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {field('Company Legal Name', legalName, setLegalName, 'legal_name', 'e.g. Kalam Sports Pvt Ltd')}
            {field('Company Display Name', displayName, setDisplayName, 'display_name', 'e.g. Kalam Sports Academy')}
          </div>

          <OREV1047DAddressBlock title="Registered Address" prefix="reg" values={reg} onChange={setReg} errors={errors} />

          <label className="flex items-center gap-3 cursor-pointer select-none">
            <input type="checkbox" checked={same} onChange={e => setSame(e.target.checked)} className="w-4 h-4 accent-blue-900" />
            <span className="text-sm text-gray-600">Operating address same as registered address</span>
          </label>

          {!same && <OREV1047DAddressBlock title="Operating Address" prefix="op" values={op} onChange={setOp} errors={errors} />}

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
              <button onClick={() => handleSave('next')} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? 'Saving…' : '💾 Save Company Details'}</button>
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
