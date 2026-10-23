// THIS FILE GOES IN: components/shared/OREV1-107B-LanguagePicker.tsx (REPLACES existing file)
'use client'
import { useState } from 'react'

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali', 'Punjabi',
  'Urdu', 'Odia', 'Assamese', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Russian', 'Mandarin',
  'Japanese', 'Korean', 'Arabic', 'Turkish', 'Dutch', 'Swedish', 'Polish', 'Vietnamese', 'Thai', 'Indonesian',
  // NOTE: shortened sample list for build — expand to full ~300 language list before production use
]

type Props = { value: string[]; onChange: (v: string[]) => void; inputStyle: any; chipActive: any }

export default function OREV1107BLanguagePicker({ value, onChange, inputStyle, chipActive }: Props) {
  const [query, setQuery] = useState('')
  const filtered = query ? LANGUAGES.filter(l => l.toLowerCase().includes(query.toLowerCase()) && !value.includes(l)) : []

  const addLang = (lang: string) => { onChange([...value, lang]); setQuery('') }
  const removeLang = (lang: string) => onChange(value.filter(l => l !== lang))

  return (
    <div className="relative">
            <div className="orgz-picker-box flex flex-wrap items-center gap-1.5 px-2 py-1.5 min-h-[40px]" style={inputStyle}>
        {value.map(l => (
          <span key={l} style={chipActive} className="text-xs px-2.5 py-1 rounded-full flex items-center gap-1.5">
            {l} <button type="button" onClick={() => removeLang(l)} className="hover:opacity-70">✕</button>
          </span>
        ))}
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder={value.length === 0 ? 'Type to search a language…' : ''}
                    className="orgz-picker-input flex-1 min-w-[100px] text-sm bg-transparent px-1 border-0 ring-0 focus:ring-0 shadow-none"
        />
      </div>
      {query && filtered.length > 0 && (
        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl max-h-40 overflow-y-auto shadow-sm">
          {filtered.slice(0, 8).map(l => (
            <button key={l} type="button" onClick={() => addLang(l)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">{l}</button>
          ))}
        </div>
      )}
    </div>
  )
}
