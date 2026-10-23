// THIS FILE GOES IN: components/shared/OREV1-107C-SubCategoryPicker.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'

type Category = { id: string; parent_id: string | null; level: number; name: string }
type Props = {
  categoryId: string; subCategories: Category[]; value: string[]; onChange: (ids: string[]) => void
  chipActive: any; chipInactive: any; inputStyle: any
}

export default function OREV1107CSubCategoryPicker({ categoryId, subCategories, value, onChange, chipActive, inputStyle }: Props) {
  const [query, setQuery] = useState('')

  if (!categoryId) return <span className="text-xs text-gray-400">Select a category first</span>
  if (subCategories.length === 0) return <span className="text-xs text-gray-400">No sub-categories available</span>

  const selected = subCategories.filter(c => value.includes(c.id))
  const filtered = query
    ? subCategories.filter(c => !value.includes(c.id) && c.name.toLowerCase().includes(query.toLowerCase()))
    : subCategories.filter(c => !value.includes(c.id))

  const addSub = (id: string) => { onChange([...value, id]); setQuery('') }
  const removeSub = (id: string) => onChange(value.filter(x => x !== id))

  return (
    <div className="relative">
            <div className="orgz-picker-box flex flex-wrap items-center gap-1.5 px-2 py-1.5 min-h-[40px]" style={inputStyle}>
        {selected.map(c => (
          <span key={c.id} style={chipActive} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
            {c.name} <button type="button" onClick={() => removeSub(c.id)} className="hover:opacity-70">✕</button>
          </span>
        ))}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={selected.length === 0 ? 'Type to search sub-category…' : ''}
                    className="orgz-picker-input flex-1 min-w-[100px] text-sm bg-transparent px-1 border-0 ring-0 focus:ring-0 shadow-none"
        />
      </div>
      {query && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl max-h-40 overflow-y-auto shadow-sm">
          {filtered.slice(0, 8).map(c => (
            <button key={c.id} type="button" onClick={() => addSub(c.id)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">{c.name}</button>
          ))}
        </div>
      )}
    </div>
  )
}
