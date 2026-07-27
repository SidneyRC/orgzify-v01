'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import type { EntityDraft } from '@/components/admin/OREV1-055-EntityRegistration'

const API = '/biz/register/api'

type Props = { entity: EntityDraft | null; onSaved: () => void; onBack: () => void; readOnly?: boolean; closeUrl?: string }

export default function OREV1068EntitySubmitOnly({ entity, onSaved, onBack, readOnly, closeUrl }: Props) {
  const { theme } = useTheme()
  const router = useRouter()
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const [saving, setSaving] = useState(false)

  const handleSubmit = async () => {
    setSaving(true)
    const res = await fetch(API, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'submit_for_review', entity_id: entity?.id })
    })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error('Failed to submit'); return }
    toast.success('Submitted for Review')
    onSaved()
  }

  if (readOnly) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-6 py-4">
          <p className="text-sm font-semibold text-gray-700">Review &amp; Submit</p>
        </div>
        <div className="px-6 pb-6 flex flex-col gap-4 border-t border-gray-50 pt-5">
          <p className="text-sm text-green-600">✓ Submitted — pending review. We'll be in touch once it's assigned to a Reporting Office.</p>
          <div className="pt-2 flex justify-end">
            <button onClick={() => router.push(closeUrl || '/')} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">✕ Close</button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="px-6 py-4">
        <p className="text-sm font-semibold text-gray-700">Review &amp; Submit</p>
      </div>
      <div className="px-6 pb-6 flex flex-col gap-4 border-t border-gray-50 pt-5">
        <p className="text-sm text-gray-500">
          Thanks for adding your details. Click below to submit your registration for review.
        </p>
        <div className="pt-2 flex justify-end gap-2">
          <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition whitespace-nowrap">← Back</button>
          <button onClick={handleSubmit} disabled={saving} style={primaryBtn} className="text-sm font-medium px-4 py-2.5 hover:opacity-90 transition disabled:opacity-50 whitespace-nowrap">{saving ? 'Submitting…' : 'Submit'}</button>
        </div>
      </div>
    </div>
  )
}