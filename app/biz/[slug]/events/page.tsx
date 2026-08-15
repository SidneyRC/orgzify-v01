// THIS FILE GOES IN: app/biz/[slug]/events/page.tsx (REPLACES existing file)
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'

type EventRow = {
  id: string; process_id: string; name: string; slug: string; status: string
  published: boolean; booking_open: boolean; under_review: boolean; event_format: string
}
const TABS = [
  { key: 'live', label: 'Live' },
  { key: 'draft', label: 'Draft' },
  { key: 'unlisted', label: 'Unlisted' },
  { key: 'closed', label: 'Closed' },
]
const STATUS_LABELS: Record<string, string> = { draft: 'Draft', pending: 'Pending', active: 'Active', rejected: 'Rejected' }
const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-500', pending: 'bg-yellow-100 text-yellow-700',
  active: 'bg-green-100 text-green-700', rejected: 'bg-red-200 text-red-800'
}

export default function EventsListPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { theme } = useTheme()
  const [entityId, setEntityId] = useState<string | null>(null)
  const [tab, setTab] = useState('draft')
  const [rows, setRows] = useState<EventRow[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [total, setTotal] = useState(0)
  const [limit] = useState(10)

  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const activePill = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const inactivePill = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }

  useEffect(() => {
    fetch('/entity/access').then(r => r.json()).then(json => {
      if (!json.allowed) { router.push(`/biz/${slug}/dashboard`); return }
      setEntityId(json.entity_id)
    })
  }, [slug])

  const loadRows = () => {
    if (!entityId) return
    setLoading(true)
    const params = new URLSearchParams({ type: 'list', entity_id: entityId, tab, page: String(page), limit: String(limit) })
    if (search) params.set('search', search)
    fetch(`/biz/events/api?${params}`).then(r => r.json()).then(j => {
      setRows(j.data || [])
      setTotal(j.total || 0)
      setLoading(false)
    })
  }

  useEffect(loadRows, [entityId, tab, page, search])
  const handleSearch = () => { setSearch(searchInput); setPage(1) }
  const handleReset = () => { setSearchInput(''); setSearch(''); setPage(1) }
  const totalPages = Math.ceil(total / limit) || 1

  const handleDelete = async (ev: EventRow, e: React.MouseEvent) => {
    e.stopPropagation()
    if (!confirm(`Delete "${ev.name}"? This cannot be undone.`)) return
    const res = await fetch('/biz/events/api', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ev.id }) })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Delete failed'); return }
    toast.success('Event deleted')
    setRows(prev => prev.filter(x => x.id !== ev.id))
  }

  const handleToggleBooking = async (ev: EventRow, e: React.MouseEvent) => {
    e.stopPropagation()
    const res = await fetch('/biz/events/api', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: ev.id, action: 'toggle_booking' }) })
    const json = await res.json()
    if (!res.ok) { toast.error(json.error || 'Update failed'); return }
    toast.success(json.data.booking_open ? 'Booking turned on' : 'Booking turned off')
    setRows(prev => prev.map(x => x.id === ev.id ? { ...x, booking_open: json.data.booking_open } : x))
  }

  return (
    <div className="w-full" style={{ backgroundColor: theme?.page_bg || '#f9fafb', minHeight: '100vh' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-6">
        <h1 className="text-xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Events</h1>
        <div className="flex gap-2">
          <button onClick={() => router.push(`/biz/${slug}/dashboard`)} style={outlineBtn} className="flex-1 sm:flex-none text-sm font-medium px-4 py-2 hover:opacity-90 transition">← Back</button>
          <button onClick={() => router.push(`/biz/${slug}/events/create`)} style={primaryBtn} className="flex-1 sm:flex-none text-sm font-medium px-4 py-2.5 hover:opacity-90 transition">+ Add Event</button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        {TABS.map(t => (
          <button key={t.key} onClick={() => { setTab(t.key); setPage(1) }} style={tab === t.key ? activePill : inactivePill} className="text-sm font-medium px-4 py-2">{t.label}</button>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
          placeholder="Search by name or process ID…" className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <div className="flex gap-2">
          <button onClick={handleReset} style={outlineBtn} className="flex-1 sm:flex-none text-sm font-medium px-4 py-2 hover:opacity-90 transition">Reset</button>
          <button onClick={handleSearch} style={primaryBtn} className="flex-1 sm:flex-none text-sm font-medium px-4 py-2 hover:opacity-90 transition">Search</button>
        </div>
      </div>

      {total > 0 && (
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-5 flex-wrap">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} style={outlineBtn} className="px-3 py-1.5 disabled:opacity-40">‹ Prev</button>
          <span>Page {page} of {totalPages}</span>
          <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} style={outlineBtn} className="px-3 py-1.5 disabled:opacity-40">Next ›</button>
          <span className="text-gray-400">{total} total</span>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : rows.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center text-sm text-gray-400">No events here yet.</div>
      ) : (
        <div className="flex flex-col gap-3">
          {rows.map(ev => (
            <div key={ev.id} onClick={() => router.push(`/biz/${slug}/events/create?ref=${ev.process_id}`)}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex items-center justify-between gap-3 cursor-pointer hover:shadow-sm transition">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">{ev.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{ev.process_id} · {ev.event_format}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLORS[ev.status] || 'bg-gray-100 text-gray-500'}`}>{STATUS_LABELS[ev.status] || ev.status}</span>
                {ev.under_review && <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-blue-100 text-blue-600">In Review</span>}

                {ev.status === 'active' && (
                  <button onClick={e => handleToggleBooking(ev, e)} title={ev.booking_open ? 'Turn booking off' : 'Turn booking on'}
                    className="relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0"
                    style={{ backgroundColor: ev.booking_open ? '#22c55e' : (theme?.btn_disabled_bg || '#e5e7eb') }}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${ev.booking_open ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                )}

                {(ev.status === 'draft' || ev.status === 'pending') && (
                  <button onClick={e => handleDelete(ev, e)} title="Delete" className="text-red-400 hover:text-red-700 transition p-1 rounded-lg hover:bg-red-50">
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
