// GOES IN: components/admin/OREV1-090-HelpDeskAccessGrid.tsx
'use client'
import { useTheme } from '@/lib/ThemeContext'

export type HelpDeskCategory = { id: string; name: string; children: { id: string; name: string }[] }
export type HelpDeskStatus = { code: string; label: string }

type Props = {
  categories: HelpDeskCategory[]
  statuses: HelpDeskStatus[]
  picks: Record<string, string[]> // sub_category_id -> [status_code, ...]
  togglePick: (subCategoryId: string, statusCode: string) => void
  readOnly?: boolean
}

export default function OREV1090HelpDeskAccessGrid({ categories, statuses, picks, togglePick, readOnly }: Props) {
  const { theme } = useTheme()

  const isChecked = (subId: string, code: string) => (picks[subId] || []).includes(code)

  const toggleAllForSubCategory = (subId: string, allChecked: boolean) => {
    statuses.forEach(s => {
      const already = isChecked(subId, s.code)
      if (allChecked && already) togglePick(subId, s.code)
      if (!allChecked && !already) togglePick(subId, s.code)
    })
  }

  if (categories.length === 0) {
    return <p className="text-xs text-gray-400 py-2">No Help Desk Categories set up yet.</p>
  }

  return (
    <div className="border border-gray-100 rounded-xl overflow-x-auto">
      <table className="w-full text-xs">
        <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
          <tr>
            <th className="text-left px-3 py-2 font-semibold whitespace-nowrap" style={{ color: theme?.table_header_text || '#6b7280' }}>Sub-category</th>
            {statuses.map(s => (
              <th key={s.code} className="text-center px-2 py-2 font-semibold whitespace-nowrap" style={{ color: theme?.table_header_text || '#6b7280' }}>{s.label}</th>
            ))}
            <th className="text-center px-2 py-2 font-semibold whitespace-nowrap" style={{ color: theme?.table_header_text || '#6b7280' }}>All</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => {
            const isSelfLeaf = cat.children.length === 1 && cat.children[0].id === cat.id
            return (
              <>
                {!isSelfLeaf && (
                  <tr key={cat.id} className="bg-gray-50/60">
                    <td colSpan={statuses.length + 2} className="px-3 py-1.5 font-medium text-gray-600">{cat.name}</td>
                  </tr>
                )}
                {cat.children.map(sub => {
                  const allOn = statuses.every(s => isChecked(sub.id, s.code))
                  return (
                    <tr key={sub.id} className="border-t border-gray-50">
                      <td className={`px-3 py-2 text-gray-500 whitespace-nowrap ${isSelfLeaf ? 'font-medium text-gray-600' : 'pl-6'}`}>{sub.name}</td>
                      {statuses.map(s => (
                        <td key={s.code} className="text-center px-2 py-2">
                          <input type="checkbox" checked={isChecked(sub.id, s.code)} disabled={readOnly} onChange={() => togglePick(sub.id, s.code)} />
                        </td>
                      ))}
                      <td className="text-center px-2 py-2">
                        <input type="checkbox" checked={allOn} disabled={readOnly} onChange={() => toggleAllForSubCategory(sub.id, allOn)} />
                      </td>
                    </tr>
                  )
                })}
              </>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
