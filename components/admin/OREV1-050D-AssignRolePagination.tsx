'use client'
type Props = { page: number; setPage: (p: number) => void; limit: number; setLimit: (l: number) => void; total: number }

export default function OREV1050DAssignRolePagination({ page, setPage, limit, setLimit, total }: Props) {
  const totalPages = Math.max(1, Math.ceil(total / limit))
  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 mb-4 flex-wrap">
      <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
        className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">‹ Prev</button>
      <input type="number" min={1} max={totalPages} value={page} onChange={e => setPage(Math.min(totalPages, Math.max(1, Number(e.target.value))))}
        className="w-12 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
      <span>of {totalPages}</span>
      <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
        className="bg-white border border-gray-200 text-gray-600 px-3 py-1.5 rounded-xl hover:bg-gray-50 disabled:opacity-40">Next ›</button>
      <span className="text-gray-300">|</span>
      <input type="number" min={1} value={limit} onChange={e => { setLimit(Number(e.target.value)); setPage(1) }}
        className="w-14 text-center border border-gray-200 rounded-xl px-2 py-1.5 text-sm focus:outline-none" />
      <span className="text-gray-400">{total} total</span>
    </div>
  )
}