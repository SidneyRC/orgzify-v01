'use client'
import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

type LocationRow = { id: string; name: string; level: 'country' | 'state' | 'city'; parent: string | null; owned_by: string | null }
type AssignedRow = { id: string; country_id: string; state_id: string | null; city_id: string | null; country_master: any; level_name: string; level: string; parent: string }

const LEVEL_LABELS: Record<string, string> = { country: 'Country', state: 'State', city: 'City' }
const LEVEL_COLORS: Record<string, string> = { country: 'bg-purple-100 text-purple-700', state: 'bg-blue-100 text-blue-700', city: 'bg-green-100 text-green-700' }

export default function OREV1048AGeofenceAssign() {
  const router = useRouter()
  const params = useSearchParams()
  const { theme } = useTheme()
  const companyId = params.get('company_id') || ''
  const companyName = params.get('name') || 'Company'

  const [tab, setTab] = useState<'unassigned' | 'assigned'>('unassigned')
  const [search, setSearch] = useState('')
  const [level, setLevel] = useState('')
  const [locations, setLocations] = useState<LocationRow[]>([])
  const [assigned, setAssigned] = useState<AssignedRow[]>([])
  const [selected, setSelected] = useState<LocationRow[]>([])
  const [saving, setSaving] = useState(false)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingAssigned, setLoadingAssigned] = useState(false)

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  const fetchLocations = useCallback(async () => {
    setLoadingList(true)
    const p = new URLSearchParams()
    if (search) p.set('search', search)
    if (level) p.set('level', level)
    const res = await fetch(`/admin/setup/geofence/assign/api?${p}`)
    const json = await res.json()
    setLocations(json.data || [])
    setLoadingList(false)
  }, [search, level])

  const fetchAssigned = useCallback(async () => {
    setLoadingAssigned(true)
    const res = await fetch(`/admin/setup/geofence/assign/api?type=assigned&company_id=${companyId}`)
    const json = await res.json()
    setAssigned(json.data || [])
    setLoadingAssigned(false)
  }, [companyId])

  useEffect(() => { fetchLocations() }, [level])
  useEffect(() => { fetchAssigned() }, [])
useEffect(() => { if (tab === 'assigned') fetchAssigned() }, [tab])

  const toggleSelect = (row: LocationRow) => {
    if (row.owned_by) return
    setSelected(prev => prev.find(r => r.id === row.id) ? prev.filter(r => r.id !== row.id) : [...prev, row])
  }

  const handleAssign = async () => {
    if (!selected.length) return toast.error('Select at least one territory')
    setSaving(true)
    const res = await fetch('/admin/setup/geofence/assign/api', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company_id: companyId, items: selected }) })
    const json = await res.json()
    if (json.error) { toast.error('Failed to assign territories'); setSaving(false); return }
    toast.success('Territories assigned successfully')
    setSelected([]); fetchLocations(); fetchAssigned(); setSaving(false)
  }

  const handleRemove = async (id: string) => {
    const res = await fetch('/admin/setup/geofence/assign/api', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) })
    const json = await res.json()
    if (json.error) return toast.error('Failed to remove territory')
    toast.success('Territory removed')
    fetchAssigned()
  }

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-800">{companyName}</h1>
        <p className="text-xs text-gray-400 mt-0.5">Territory assignment</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-100 mb-5">
        {(['unassigned', 'assigned'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} className={`px-5 py-2.5 text-sm font-medium border-b-2 transition capitalize ${tab === t ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
            {t === 'assigned' ? `Assigned (${assigned.length})` : 'Unassigned'}
          </button>
        ))}
      </div>

      {tab === 'unassigned' && (
        <>
          {/* Search + level filter */}
          <div className="flex gap-2 mb-3 flex-wrap">
            <input value={search} onChange={e => setSearch(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') fetchLocations() }}
              placeholder="Search country, state or city…"
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400 min-w-0" />
            <button onClick={fetchLocations} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 shrink-0">Search</button>
          </div>
          <div className="flex gap-2 mb-4 flex-wrap">
            {['', 'country', 'state', 'city'].map(lv => (
              <button key={lv} onClick={() => setLevel(lv)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition ${level === lv ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-gray-500 border-gray-200 hover:bg-gray-50'}`}>
                {lv === '' ? 'All levels' : LEVEL_LABELS[lv]}
              </button>
            ))}
          </div>

          {/* Location list */}
          <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white mb-4">
            {loadingList && <p className="text-center py-10 text-sm text-gray-400">Loading…</p>}
            {!loadingList && locations.length === 0 && <p className="text-center py-10 text-sm text-gray-400">No results. Try searching.</p>}
            {!loadingList && locations.map(r => (
              <div key={r.id} onClick={() => toggleSelect(r)}
                className={`flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0 transition ${r.owned_by ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'cursor-pointer hover:bg-blue-50'}`}>
                <input type="checkbox" readOnly checked={!!selected.find(s => s.id === r.id)} disabled={!!r.owned_by} className="accent-blue-600" />
                <span className="flex-1 text-sm font-medium text-gray-800">{r.name}</span>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[r.level]}`}>{LEVEL_LABELS[r.level]}</span>
                {r.owned_by
                  ? <span className="text-xs text-red-500 shrink-0">Owned by: {r.owned_by}</span>
                  : <span className="text-xs text-gray-400 shrink-0">{r.parent || ''}</span>}
              </div>
            ))}
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-2">
            <button onClick={() => router.push('/admin/setup/geofence')} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Close</button>
            <button onClick={() => setSelected([])} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Clear</button>
            <button onClick={handleAssign} disabled={saving || !selected.length} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 disabled:opacity-50">
              {saving ? 'Assigning…' : `Assign selected (${selected.length})`}
            </button>
          </div>
        </>
      )}

      {tab === 'assigned' && (
        <>
        <div className="border border-gray-100 rounded-2xl overflow-hidden bg-white mb-4">
          {loadingAssigned && <p className="text-center py-10 text-sm text-gray-400">Loading…</p>}
          {!loadingAssigned && assigned.length === 0 && <p className="text-center py-10 text-sm text-gray-400">No territories assigned yet.</p>}
          {!loadingAssigned && assigned.map(r => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-3 border-b border-gray-50 last:border-0">
              <span className="flex-1 text-sm font-medium text-gray-800">{r.level_name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${LEVEL_COLORS[r.level]}`}>{LEVEL_LABELS[r.level]}</span>
              <span className="text-xs text-gray-400">{r.parent}</span>
              <button onClick={() => handleRemove(r.id)} className="text-xs px-3 py-1 rounded-full border border-red-200 text-red-500 bg-red-50 hover:bg-red-100 transition shrink-0">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex justify-end">
          <button onClick={() => router.push('/admin/setup/geofence')} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Close</button>
        </div>
        </>
      )}
    </div>
  )
}
