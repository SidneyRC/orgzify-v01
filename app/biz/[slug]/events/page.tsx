// THIS FILE GOES IN: app/biz/[slug]/events/page.tsx (REPLACES existing file)
'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useTheme } from '@/lib/ThemeContext'
import toast from 'react-hot-toast'
import OREV1150EventListRow, { EventListHeader, type EventRow } from '@/components/shared/OREV1-150-EventListRow'

const TABS = [
  { key: 'live', label: 'Live' },
  { key: 'draft', label: 'Draft' },
  { key: 'unlisted', label: 'Unlisted' },
  { key: 'closed', label: 'Closed' },
]

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
        <>
          <EventListHeader theme={theme} showBooking={tab !== 'draft'} />
          <div className="flex flex-col gap-3">
            {rows.map(ev => (
              <OREV1150EventListRow key={ev.id} ev={ev} theme={theme} onOpen={() => router.push(`/biz/${slug}/events/create?ref=${ev.process_id}`)} onToggle={handleToggleBooking} onDelete={handleDelete} />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
