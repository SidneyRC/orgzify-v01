'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import type { WizardData } from '@/components/admin/OREV1-047A-CompanyWizard'
import OREV1047DAddressBlock, { emptyAddress, type AddressData } from '@/components/admin/OREV1-047D-AddressBlock'

type Props = {
  data: WizardData
  draftId: string
  onNext: (patch: Partial<WizardData>) => void
  onSaveDraft: (patch: Partial<WizardData>) => void
  onBack: () => void
  saving: boolean
}

const API = '/admin/setup/companies/new/api'

async function saveAddress(company_id: string, address_type: string, address: AddressData) {
  const res = await fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'save_address', company_id, address_type, address: {
      pincode: address.pincode, area: address.area, line1: address.line1, line2: address.line2,
      city: address.city_id, district: address.district_id, state: address.state_id,
      country_id: address.country_id, landmark: address.landmark
    }})
  })
  return res.json()
}

export default function OREV1047DWizardStep3({ data, draftId, onNext, onSaveDraft, onBack, saving }: Props) {
  const { theme } = useTheme()
  const router = useRouter()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const [reg, setReg] = useState<AddressData>(emptyAddress())
  const [op, setOp] = useState<AddressData>(emptyAddress())
  const [same, setSame] = useState<boolean>(true)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [busy, setBusy] = useState(false)
  const [loadingAddr, setLoadingAddr] = useState(false)

  // Load existing address from DB when component mounts
  useEffect(() => {
    if (!draftId) return
    setLoadingAddr(true)
    fetch(API, { method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'get_address', company_id: draftId })
    }).then(r => r.json()).then(j => {
      const rows = j.data || []
      const regRow = rows.find((r: any) => r.address_type === 'registered')
      const opRow = rows.find((r: any) => r.address_type === 'operating')
      if (regRow) {
        setReg({
          pincode: regRow.pincode || '', area: regRow.area || '',
          line1: regRow.line1 || '', line2: regRow.line2 || '',
          city_id: regRow.city || '', city_name: regRow.city_name || '',
          district_id: regRow.district || '', district_name: regRow.district_name || '',
          state_id: regRow.state || '', state_name: regRow.state_name || '',
          country_id: regRow.country_id || '', landmark: regRow.landmark || ''
        })
      }
      if (opRow) {
        const isSame = regRow && opRow.pincode === regRow.pincode && opRow.line1 === regRow.line1
        setSame(isSame)
        if (!isSame) setOp({
          pincode: opRow.pincode || '', area: opRow.area || '',
          line1: opRow.line1 || '', line2: opRow.line2 || '',
          city_id: opRow.city || '', city_name: opRow.city_name || '',
          district_id: opRow.district || '', district_name: opRow.district_name || '',
          state_id: opRow.state || '', state_name: opRow.state_name || '',
          country_id: opRow.country_id || '', landmark: opRow.landmark || ''
        })
      }
      setLoadingAddr(false)
    }).catch(() => setLoadingAddr(false))
  }, [draftId])

  const validate = () => {
    const e: Record<string, string> = {}
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

  const handleNext = async () => {
    if (!validate()) return
    if (!draftId) { toast.error('Draft not found. Please go back and try again.'); return }
    setBusy(true)
    const regRes = await saveAddress(draftId, 'registered', reg)
    if (regRes.error) { toast.error('Failed to save registered address.'); setBusy(false); return }
    const opRes = await saveAddress(draftId, 'operating', same ? reg : op)
    if (opRes.error) { toast.error('Failed to save operating address.'); setBusy(false); return }
    setBusy(false)
    onNext({})
  }

  const isBusy = saving || busy

  if (loadingAddr) return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex items-center justify-center min-h-48">
      <p className="text-sm text-gray-400">Loading address…</p>
    </div>
  )

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-6">
      <OREV1047DAddressBlock title="Registered Address" prefix="reg"
        values={reg} onChange={setReg} errors={errors} />

      <label className="flex items-center gap-3 cursor-pointer select-none">
        <input type="checkbox" checked={same} onChange={e => setSame(e.target.checked)} className="w-4 h-4 accent-blue-900" />
        <span className="text-sm text-gray-600">Operating address same as registered address</span>
      </label>

      {!same && <OREV1047DAddressBlock title="Operating Address" prefix="op"
        values={op} onChange={setOp} errors={errors} />}

      {/* Desktop: one row right-aligned | Mobile: row1 justified, row2 full width */}
      <div className="pt-2">
        <div className="hidden sm:flex sm:justify-end sm:gap-2">
          <button onClick={() => router.push('/admin/setup/companies')} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
          <button onClick={() => onSaveDraft({})} disabled={isBusy} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">💾 Save Draft</button>
          <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">← Back</button>
          <button onClick={handleNext} disabled={isBusy} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{isBusy ? 'Saving…' : 'Next: Review →'}</button>
        </div>
        <div className="flex flex-col gap-2 sm:hidden">
          <div className="flex gap-2">
            <button onClick={() => router.push('/admin/setup/companies')} style={outlineBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
            <button onClick={() => onSaveDraft({})} disabled={isBusy} style={outlineBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">💾 Save Draft</button>
            <button onClick={onBack} style={outlineBtn} className="flex-1 text-sm font-medium py-2.5 hover:opacity-90 transition whitespace-nowrap">← Back</button>
          </div>
          <button onClick={handleNext} disabled={isBusy} style={primaryBtn} className="w-full text-sm font-medium py-2.5 hover:opacity-90 transition disabled:opacity-50">{isBusy ? 'Saving…' : 'Next: Review →'}</button>
        </div>
      </div>
    </div>
  )
}
