'use client'
import { useState, useEffect } from 'react'
import { useTheme } from '@/lib/ThemeContext'

const API = '/admin/setup/company-auth/api'

type Props = { companyId: string; moduleCode: string; companyName: string; moduleName: string; onClose: () => void }

export default function OREV1066RegionAuthHistory({ companyId, moduleCode, companyName, moduleName, onClose }: Props) {
  const { theme } = useTheme()
  const radius = theme?.global_border_radius || '12px'
  const outlineBtn = { backgroundColor: theme?.btn_outline_bg || '#fff', color: theme?.btn_outline_text || '#4b5563', border: `1px solid ${theme?.btn_outline_border || '#e5e7eb'}`, borderRadius: radius }
  const [rows, setRows] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`${API}?type=history&company_id=${companyId}&module_code=${moduleCode}`).then(r => r.json()).then(j => {
      setRows(j.data || []); setLoading(false)
    }).catch(() => setLoading(false))
  }, [companyId, moduleCode])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-full max-w-lg flex flex-col gap-4 max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>Assignment History</h2>
          <p className="text-xs text-gray-400 mt-0.5">{companyName} — {moduleName}</p>
        </div>

        {loading ? <p className="text-sm text-gray-400">Loading…</p> : rows.length === 0 ? (
          <p className="text-sm text-gray-400">No history found</p>
        ) : (
          <div className="flex flex-col gap-2">
            {rows.map(r => (
              <div key={r.id} className="border border-gray-100 rounded-xl p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium">{r.staff.name}</p>
                  <p className="text-xs text-gray-400">{r.staff.email} {r.staff.mobile && `· ${r.staff.mobile}`}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    From {new Date(r.created_at).toLocaleDateString()} {r.end_date ? `to ${new Date(r.end_date).toLocaleDateString()}` : '— present'}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${r.status === 'active' ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'}`}>{r.status}</span>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <button onClick={onClose} style={outlineBtn} className="text-sm font-medium px-4 py-2 hover:opacity-90 transition">Close</button>
        </div>
      </div>
    </div>
  )
}