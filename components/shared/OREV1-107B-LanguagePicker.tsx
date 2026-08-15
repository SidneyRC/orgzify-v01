// THIS FILE GOES IN: components/shared/OREV1-107B-LanguagePicker.tsx (NEW FILE)
'use client'
import { useState } from 'react'

const LANGUAGES = [
  'English', 'Hindi', 'Tamil', 'Telugu', 'Kannada', 'Malayalam', 'Marathi', 'Gujarati', 'Bengali', 'Punjabi',
  'Urdu', 'Odia', 'Assamese', 'Spanish', 'French', 'German', 'Portuguese', 'Italian', 'Russian', 'Mandarin',
  'Japanese', 'Korean', 'Arabic', 'Turkish', 'Dutch', 'Swedish', 'Polish', 'Vietnamese', 'Thai', 'Indonesian',
  // NOTE: shortened sample list for build — expand to full ~300 language list before production use
]

type Props = { value: string[]; onChange: (v: string[]) => void; inputStyle: any }

export default function OREV1107BLanguagePicker({ value, onChange, inputStyle }: Props) {
  const [query, setQuery] = useState('')
  const filtered = query ? LANGUAGES.filter(l => l.toLowerCase().includes(query.toLowerCase()) && !value.includes(l)) : []

  const addLang = (lang: string) => { onChange([...value, lang]); setQuery('') }
  const removeLang = (lang: string) => onChange(value.filter(l => l !== lang))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map(l => (
          <span key={l} className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-600 flex items-center gap-1.5">
            {l} <button onClick={() => removeLang(l)} className="hover:text-blue-900">✕</button>
          </span>
        ))}
      </div>
      <div className="relative">
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Type to search a language…" className="h-10 px-3 text-sm w-full focus:outline-none" style={inputStyle} />
        {filtered.length > 0 && (
          <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-xl max-h-40 overflow-y-auto shadow-sm">
            {filtered.slice(0, 8).map(l => (
              <button key={l} onClick={() => addLang(l)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50">{l}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
