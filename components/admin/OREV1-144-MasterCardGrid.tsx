// THIS FILE GOES IN: components/admin/OREV1-144-MasterCardGrid.tsx (NEW FILE)
'use client'
import { useState } from 'react'
import Link from 'next/link'

type Card = { title: string; description: string; href: string; meta: string; icon: string }
type Props = { cards: Card[]; radius: string; textPrimary: string; textMuted: string; inputBg?: string; inputBorder?: string }

export default function OREV1144MasterCardGrid({ cards, radius, textPrimary, textMuted, inputBg, inputBorder }: Props) {
  const [search, setSearch] = useState('')
  const filtered = cards.filter(c => c.title.toLowerCase().includes(search.toLowerCase()))
  const inputStyle = { backgroundColor: inputBg || '#fff', border: `1px solid ${inputBorder || '#e5e7eb'}`, borderRadius: radius }

  return (
    <>
      <div className="mb-6 max-w-sm">
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by title…"
          className="w-full h-10 px-4 text-sm focus:outline-none" style={inputStyle} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtered.length === 0 && <p className="text-sm col-span-full" style={{ color: textMuted }}>No matching cards found.</p>}
        {filtered.map((card) => (
          <Link key={card.title} href={card.href} style={{ borderRadius: radius }}
            className="bg-white border border-gray-100 p-7 hover:shadow-lg transition-shadow flex flex-col gap-4">
            <span className="text-4xl">{card.icon}</span>
            <div>
              <p className="text-base font-semibold" style={{ color: textPrimary }}>{card.title}</p>
              <p className="text-sm mt-0.5" style={{ color: textMuted }}>{card.description}</p>
            </div>
            <p className="text-xs border-t border-gray-50 pt-2" style={{ color: textMuted }}>{card.meta}</p>
          </Link>
        ))}
      </div>
    </>
  )
}
