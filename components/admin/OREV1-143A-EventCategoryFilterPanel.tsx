// THIS FILE GOES IN: components/admin/OREV1-143A-EventCategoryFilterPanel.tsx (NEW FILE)
'use client'
import { useTheme } from '@/lib/ThemeContext'

export type EventCategoryFilters = { search: string; level: string; status: string }
export const EMPTY_FILTERS: EventCategoryFilters = { search: '', level: '', status: '' }

const LEVEL_LABELS: Record<string, string> = { '1': 'Category', '2': 'Sub-Category' }
const STATUS_LABELS: Record<string, string> = { active: 'Active', inactive: 'Inactive', archived: 'Archived' }

type Props = {
  open: boolean; draft: EventCategoryFilters; onDraftChange: (f: EventCategoryFilters) => void
  onApply: () => void; onCancel: () => void; onReset: () => void
}

export default function OREV1143AEventCategoryFilterPanel({ open, draft, onDraftChange, onApply, onCancel, onReset }: Props) {
  const { theme } = useTheme()
  if (!open) return null

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const inputStyle = { backgroundColor: theme?.input_bg || '#fff', border: `1px solid ${theme?.input_border || '#e5e7eb'}`, borderRadius: radius }
  const chipActive = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderColor: theme?.btn_bg || '#1e3a8a' }
  const chipInactive = { backgroundColor: theme?.input_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', borderColor: theme?.input_border || '#e5e7eb' }

  const set = (key: keyof EventCategoryFilters, value: string) => onDraftChange({ ...draft, [key]: value })

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} />
      <div className="relative w-full sm:w-[380px] h-full bg-white flex flex-col shadow-xl">

        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <span className="text-base font-semibold text-gray-800">Filter categories</span>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700 transition p-1">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 flex flex-col gap-5">
          <div className="flex flex-col gap-1">
            <label className="text-xs text-gray-500">Search (name)</label>
            <input value={draft.search} onChange={e => set('search', e.target.value)} placeholder="Type to search…"
              className="h-9 px-3 text-sm focus:outline-none w-full" style={inputStyle} />
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
            <label className="text-xs text-gray-500">Level</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(LEVEL_LABELS).map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('level', draft.level === v ? '' : v)}
                  style={draft.level === v ? chipActive : chipInactive}
                  className="text-xs px-3 py-1.5 rounded-full border transition">{l}</button>
              ))}
            </div>
          </div>

          <div className="border-t border-gray-100 pt-4 flex flex-col gap-2">
            <label className="text-xs text-gray-500">Status</label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(STATUS_LABELS).map(([v, l]) => (
                <button key={v} type="button" onClick={() => set('status', draft.status === v ? '' : v)}
                  style={draft.status === v ? chipActive : chipInactive}
                  className="text-xs px-3 py-1.5 rounded-full border transition">{l}</button>
              ))}
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
