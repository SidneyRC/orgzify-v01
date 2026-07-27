'use client'
import { useTheme } from '@/lib/ThemeContext'

type Props = { total: number; resolved: number; open: number }

export default function OREV1082SupportSummaryCards({ total, resolved, open }: Props) {
  const { theme } = useTheme()
  const cardBase = "bg-white rounded-2xl border border-gray-100 p-4 text-center"
  return (
    <div className="grid grid-cols-3 gap-2 mb-5">
      <div className={cardBase}><p className="text-xs text-gray-400">Total</p><p className="text-xl font-semibold" style={{ color: theme?.color_text_primary || '#111827' }}>{total}</p></div>
      <div className={cardBase}><p className="text-xs text-gray-400">Resolved</p><p className="text-xl font-semibold text-green-600">{resolved}</p></div>
      <div className={cardBase}><p className="text-xs text-gray-400">Open</p><p className="text-xl font-semibold text-orange-500">{open}</p></div>
    </div>
  )
}