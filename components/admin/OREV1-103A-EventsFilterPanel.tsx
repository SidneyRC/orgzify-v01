// THIS FILE GOES IN: components/admin/OREV1-103A-EventsFilterPanel.tsx (REPLACES existing file)
'use client'
import { useTheme } from '@/lib/ThemeContext'
import FilterAutocomplete from '@/components/admin/OREV1-103B-FilterAutocomplete'

export type EventFilters = {
  search: string; country: string; state: string; city: string
  reporting_office: string; entity_name: string; status: string[]
  created_from: string; created_to: string; scheduled_from: string; scheduled_to: string
}

export const EMPTY_FILTERS: EventFilters = {
  search: '', country: '', state: '', city: '', reporting_office: '', entity_name: '', status: [],
  created_from: '', created_to: '', scheduled_from: '', scheduled_to: ''
}

const STATUS_LABELS: Record<string, string> = { draft: 'Draft', pending: 'Pending', active: 'Active', rejected: 'Rejected' }

type Props = {
  open: boolean; draft: EventFilters; onDraftChange: (f: EventFilters) => void
  onApply: () => void; onCancel: () => void; onReset: () => void
}

export default function OREV1103AEventsFilterPanel({ open, draft, onDraftChange, onApply, onCancel, onReset }: Props) {
  const { theme } = useTheme()
  if (!open) return null

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const chipActive = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderColor: theme?.btn_bg || '#1e3a8a' }
  const chipInactive = { backgroundColor: theme?.input_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', borderColor: theme?.input_border || '#e5e7eb' }

  const set = (key: keyof EventFilters, value: string) => onDraftChange({ ...draft, [key]: value })
  const toggleStatus = (v: string) => {
    const has = draft.status.includes(v)
    onDraftChange({ ...draft, status: has ? draft.status.filter(s => s !== v) : [...draft.status, v] })
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full sm:w-[380px] h-full bg-white flex flex-col shadow-xl">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-base font-semibold text-gray-800">Filter events</span>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 transition p-1">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Search (name / process ID)</label>
            <input value={draft.search} onChange={e => set('search', e.target.value)} placeholder="Type to search…"
              className="h-9 px-3 text-sm focus:outline-none w-full" style={inputStyle} />
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
            <label className="text-xs text-gray-500">Status</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <button key={v} type="button" onClick={() => toggleStatus(v)}
                  style={draft.status.includes(v) ? chipActive : chipInactive}
                  className="text-xs px-3 py-1.5 rounded-full border transition">{l}</button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
            <label className="text-xs text-gray-500 -mb-1">Location & Office</label>
            <FilterAutocomplete label="Country" field="country" value={draft.country} onChange={v => set('country', v)} inputStyle={inputStyle} />
            <FilterAutocomplete label="State" field="state" value={draft.state} onChange={v => set('state', v)} inputStyle={inputStyle} />
            <FilterAutocomplete label="City" field="city" value={draft.city} onChange={v => set('city', v)} inputStyle={inputStyle} />
            <FilterAutocomplete label="Reporting Office" field="reporting_office" value={draft.reporting_office} onChange={v => set('reporting_office', v)} inputStyle={inputStyle} />
            <FilterAutocomplete label="Entity Name" field="entity_name" value={draft.entity_name} onChange={v => set('entity_name', v)} inputStyle={inputStyle} />
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col gap-3">
            <label className="text-xs text-gray-500 -mb-1">Event Created</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1"><label className="text-xs text-gray-500">From</label>
                <input type="date" value={draft.created_from} onChange={e => set('created_from', e.target.value)} className="h-9 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs text-gray-500">To</label>
                <input type="date" value={draft.created_to} onChange={e => set('created_to', e.target.value)} className="h-9 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></div>
            </div>
            <label className="text-xs text-gray-500 -mb-1">Scheduled Date</label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex flex-col gap-1"><label className="text-xs text-gray-500">From</label>
                <input type="date" value={draft.scheduled_from} onChange={e => set('scheduled_from', e.target.value)} className="h-9 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></div>
              <div className="flex flex-col gap-1"><label className="text-xs text-gray-500">To</label>
                <input type="date" value={draft.scheduled_to} onChange={e => set('scheduled_to', e.target.value)} className="h-9 px-3 text-sm focus:outline-none w-full" style={inputStyle} /></div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between gap-2 px-5 py-4 border-t border-gray-100">
          <button onClick={onReset} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 transition">Reset</button>
          <div className="flex gap-2">
            <button onClick={onCancel} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 transition">Cancel</button>
            <button onClick={onApply} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 transition">Apply</button>
          </div>
        </div>

      </div>
    </div>
  )
}
