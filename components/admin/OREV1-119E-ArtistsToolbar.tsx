// THIS FILE GOES IN: components/admin/OREV1-119E-ArtistsToolbar.tsx (NEW FILE)
'use client'
type Props = {
  theme: any; statusFilter: string; setStatusFilter: (v: string) => void; searchInput: string; setSearchInput: (v: string) => void
  page: number; setPage: (fn: (p: number) => number) => void; limit: number; setLimit: (v: number) => void; total: number; totalPages: number
  STATUS_LABELS: Record<string, string>; onSearch: () => void; onReset: () => void; onDownload: () => void; onAdd: () => void; onBack: () => void
}

export default function OREV1119EArtistsToolbar({ theme, statusFilter, setStatusFilter, searchInput, setSearchInput, page, setPage, limit, setLimit, total, totalPages, STATUS_LABELS, onSearch, onReset, onDownload, onAdd, onBack }: Props) {
  const radius = theme?.global_border_radius || '12px'
  const primaryBtn = { backgroundColor: theme?.btn_bg || '#1e3a8a', color: theme?.btn_text || '#fff', borderRadius: radius }
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const selectClass = "w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-blue-400 bg-white"

  return (
    <>
      <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
        <h1 className="text-2xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Artists</h1>
        <div className="flex gap-2">
          <button onClick={onDownload} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">⬇ Download</button>
          <button onClick={onBack} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">← Back</button>
          <button onClick={onAdd} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">+ Add Artist</button>
        </div>
      </div>
      <div className="mb-3">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectClass}>
          <option value="">All Statuses</option>
          {['pending', 'active', 'rejected'].map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        </select>
      </div>
      <div className="flex gap-2 mb-5 items-center">
        <input value={searchInput} onChange={e => setSearchInput(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') onSearch() }} placeholder="Search by artist name…" className="flex-1 border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:border-blue-400" />
        <button onClick={onReset} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Reset</button>
        <button onClick={onSearch} style={primaryBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90">Search</button>
      </div>
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
        <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">‹ Prev</button>
        <input type="number" min={1} max={totalPages} value={page} onChange={e => setPage(() => Math.min(totalPages, Math.max(1, Number(e.target.value))))} className="w-12 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
        <span>of {totalPages}</span>
        <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">Next ›</button>
        <span className="text-gray-300">|</span>
        <input type="number" min={1} value={limit} onChange={e => setLimit(Number(e.target.value))} className="w-14 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
        <span className="text-gray-400">{total} total</span>
      </div>
    </>
  )
}
