// GOES IN: components/admin/OREV1-092-VenueForm.tsx (REPLACES existing file)
'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1047DAddressBlock, { emptyAddress, type AddressData } from '@/components/admin/OREV1-047D-AddressBlock'
import OREV1093FacilitiesMultiSelect from '@/components/admin/OREV1-093-FacilitiesMultiSelect'
import OREV1094EntityMultiSelect from '@/components/admin/OREV1-094-EntityMultiSelect'
import OREV1096LocationSearch from '@/components/admin/OREV1-096-LocationSearch'
import { ensurePincodeSaved } from '@/lib/addressHelpers'

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending', inactive: 'Inactive', active: 'Active',
  rejected: 'Rejected', suspended: 'Suspended', blocked: 'Blocked', archived: 'Archived'
}
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700', inactive: 'bg-gray-100 text-gray-500', active: 'bg-green-100 text-green-700',
  rejected: 'bg-red-200 text-red-800', suspended: 'bg-red-100 text-red-600', blocked: 'bg-gray-800 text-white', archived: 'bg-gray-200 text-gray-500'
}

const ADMIN_API = '/admin/master/venue/api'
const ENTITY_CREATE_API = '/biz/events/eventvenue/create-venue/api'

type EntityMode = { entityId: string; entitySlug: string; returnRef: string }
type Props = { venueId?: string; mode: 'add' | 'edit' | 'view'; entityMode?: EntityMode }

export default function OREV1092VenueForm({ venueId, mode: initialMode, entityMode }: Props) {
  const router = useRouter()
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const API = entityMode ? ADMIN_API : ADMIN_API // reads (offices/search_location) stay on the admin route — ungated
  const [mode, setMode] = useState(initialMode)
  const readOnly = mode === 'view'
  const backHref = entityMode ? `/biz/${entityMode.entitySlug}/events/create?ref=${entityMode.returnRef}` : '/admin/master/venue'

  const [internalName, setInternalName] = useState('')
  const [externalName, setExternalName] = useState('')
  const [address, setAddress] = useState<AddressData>(emptyAddress())
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [locationName, setLocationName] = useState('')
  const [referenceLink, setReferenceLink] = useState('')
  const [facilities, setFacilities] = useState<string[]>([])
  const [capacity, setCapacity] = useState('')
  const [visibility, setVisibility] = useState<'all' | 'exclusive'>('all')
  const [exclusiveEntityIds, setExclusiveEntityIds] = useState<string[]>([])
  const [entityLabels, setEntityLabels] = useState<Record<string, string>>({})
  const [processId, setProcessId] = useState('')
  const [status, setStatus] = useState('')
  const [reviewNote, setReviewNote] = useState<{ action_type: string; note: string | null; created_at: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(!!venueId)

  useEffect(() => {
    if (!venueId) return
    fetch(`${ADMIN_API}?id=${venueId}`).then(r => r.json()).then(j => {
      const v = j.data
      if (!v) { setLoading(false); return }
      setProcessId(v.process_id)
      setStatus(v.status || '')
      setReviewNote(v.latest_review_note || null)
      setInternalName(v.internal_name); setExternalName(v.external_name)
      setAddress({
        pincode: v.pincode || '', area: v.area || '', line1: v.line1 || '', line2: v.line2 || '',
        city_id: v.city_id || '', city_name: v.city_name || '', district_id: v.district_id || '', district_name: v.district_name || '',
        state_id: v.state_id || '', state_name: v.state_name || '', country_id: v.country_id || '', landmark: v.landmark || ''
      })
      setLatitude(v.latitude ?? null); setLongitude(v.longitude ?? null); setLocationName(v.location_display_name || '')
      setReferenceLink(v.reference_link || ''); setFacilities(v.facilities_amenities || [])
      setCapacity(v.capacity != null ? String(v.capacity) : '')
      setVisibility(v.visibility || 'all'); setExclusiveEntityIds(v.exclusive_entity_ids || [])
      setEntityLabels(v.entity_labels || {})
      setLoading(false)
    })
  }, [venueId])

  const validate = () => {
    const e: Record<string, string> = {}
    if (!internalName.trim()) e.internal_name = 'Required'
    if (!externalName.trim()) e.external_name = 'Required'
    if (!address.pincode.trim()) e.reg_pincode = 'Required'
    if (!address.line1.trim()) e.reg_line1 = 'Required'
    if (!address.city_id) e.reg_city_id = 'Required'
    if (!address.state_id) e.reg_state_id = 'Required'
    if (!address.country_id) e.reg_country_id = 'Required'
    if ((latitude == null || longitude == null) && !referenceLink.trim()) {
      e.location = 'Fill either Search Location or Reference Link'
      e.reference_link = 'Fill either Search Location or Reference Link'
    }
    if (!entityMode && visibility === 'exclusive' && exclusiveEntityIds.length === 0) e.exclusive_entity_ids = 'Select at least one Entity'
    setErrors(e); return Object.keys(e).length === 0
  }

  const handleSave = async () => {
    if (!validate()) return
    setSaving(true)
    await ensurePincodeSaved(address)
    const payload = {
      id: venueId || undefined,
      internal_name: internalName, external_name: externalName,
      pincode: address.pincode, area: address.area, line1: address.line1, line2: address.line2,
      city_id: address.city_id, district_id: address.district_id, state_id: address.state_id, country_id: address.country_id, landmark: address.landmark,
      latitude, longitude, location_display_name: locationName, reference_link: referenceLink || null,
      facilities_amenities: facilities,
      capacity: capacity ? parseInt(capacity) : null,
      visibility, exclusive_entity_ids: visibility === 'exclusive' ? (entityMode ? [entityMode.entityId] : exclusiveEntityIds) : [],
    }
    const endpoint = entityMode ? ENTITY_CREATE_API : ADMIN_API
    const res = await fetch(endpoint, { method: entityMode ? 'POST' : (venueId ? 'PATCH' : 'POST'), headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    const json = await res.json()
    setSaving(false)
    if (json.error) { toast.error(json.error); return }
    toast.success(entityMode ? 'Venue submitted for approval' : (venueId ? 'Venue updated' : 'Venue created'))
    router.push(backHref)
  }

  if (loading) return <div className="p-6 text-sm text-gray-400">Loading…</div>

  return (
    <div className="p-4 sm:p-6 max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-lg font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>
            {mode === 'add' ? 'Add Venue' : mode === 'edit' ? 'Edit Venue' : 'View Venue'}
          </h1>
          {processId && <p className="text-xs text-gray-400 font-mono mt-0.5">{processId}</p>}
          {status && (
            <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-medium mt-1 ${STATUS_COLORS[status] || 'bg-gray-100 text-gray-500'}`}>{STATUS_LABELS[status] || status}</span>
          )}
          {reviewNote && ['reject', 'suspend', 'block'].includes(reviewNote.action_type) && (
            <p className="text-xs text-red-500 mt-1">Reason: {reviewNote.note || '—'}</p>
          )}
        </div>
        <div className="flex gap-2">
          {mode === 'view' && !entityMode && <button onClick={() => setMode('edit')} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">✎ Edit</button>}
          <button onClick={() => router.push(backHref)} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">← Back</button>
        </div>
      </div>

      <div className={`bg-white rounded-2xl border border-gray-100 p-6 flex flex-col gap-6 ${readOnly ? 'opacity-70 pointer-events-none' : ''}`}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Internal Name <span className="text-red-500">*</span></label>
            <input value={internalName} onChange={e => setInternalName(e.target.value)} className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
            {errors.internal_name && <span className="text-xs text-red-500">{errors.internal_name}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">External Name <span className="text-red-500">*</span></label>
            <input value={externalName} onChange={e => setExternalName(e.target.value)} className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
            {errors.external_name && <span className="text-xs text-red-500">{errors.external_name}</span>}
          </div>
        </div>

        <OREV1047DAddressBlock title="Venue Address" prefix="reg" values={address} onChange={setAddress} errors={errors} />

        <OREV1096LocationSearch latitude={latitude} longitude={longitude} displayName={locationName}
          onChange={(lat, lon, name) => {
            setLatitude(lat); setLongitude(lon); setLocationName(name)
            if (lat != null && lon != null) setErrors(prev => { const { location, reference_link, ...rest } = prev; return rest })
          }}
          apiBase={API} error={errors.location} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Reference Link</label>
            <input value={referenceLink} onChange={e => {
              setReferenceLink(e.target.value)
              if (e.target.value.trim()) setErrors(prev => { const { location, reference_link, ...rest } = prev; return rest })
            }} placeholder="Fill this or Search Location above" className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
            {errors.reference_link && <span className="text-xs text-red-500">{errors.reference_link}</span>}
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Capacity</label>
            <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} placeholder="Optional" className="h-10 px-3 text-sm focus:outline-none" style={inputStyle} />
          </div>
        </div>

        <OREV1093FacilitiesMultiSelect value={facilities} onChange={setFacilities} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Visibility <span className="text-red-500">*</span></label>
            <select value={visibility} onChange={e => setVisibility(e.target.value as 'all' | 'exclusive')} className="h-10 px-3 text-sm focus:outline-none" style={inputStyle}>
              <option value="all">All (Shared)</option>
              <option value="exclusive">{entityMode ? 'Exclusive (Only my organisation)' : 'Exclusive'}</option>
            </select>
          </div>
          {visibility === 'exclusive' && !entityMode && (
            <OREV1094EntityMultiSelect value={exclusiveEntityIds} selectedLabels={entityLabels}
              onChange={(ids, labels) => { setExclusiveEntityIds(ids); setEntityLabels(labels) }}
              apiBase={ADMIN_API} error={errors.exclusive_entity_ids} />
          )}
        </div>

        {!readOnly && (
          <div className="flex justify-end pt-2">
            <button onClick={handleSave} disabled={saving} style={primaryBtn} className="text-sm font-medium px-5 py-2.5 hover:opacity-90 disabled:opacity-50">
              {saving ? 'Saving…' : entityMode ? '💾 Submit Venue' : '💾 Save Venue'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
