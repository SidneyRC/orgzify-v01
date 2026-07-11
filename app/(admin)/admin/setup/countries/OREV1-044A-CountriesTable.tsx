'use client'
import Image from 'next/image'

type Country = {
  id: string; name: string; official_name: string; iso2: string; iso3: string; numeric_code: string;
  phone_code: string; currency_code: string; currency_symbol: string; currency_name: string;
  capital: string; region: string; subregion: string; population: number;
  timezones: string[]; flag_url: string; flag_emoji: string;
}

const HEADERS = ['Flag', 'Country', 'Official Name', 'ISO2', 'ISO3', 'Numeric', 'Phone', 'Currency Code', 'Currency Symbol', 'Currency Name', 'Capital', 'Region', 'Subregion', 'Population', 'Timezone']

export default function CountriesTable({ rows, theme }: { rows: Country[]; theme: any }) {
  const textPrimary = theme?.color_text_primary || '#111827'
  const textMuted = theme?.color_text_muted || '#9ca3af'

  const fields = (c: Country): [string, string][] => [
    ['Official Name', c.official_name || '—'], ['ISO2', c.iso2], ['ISO3', c.iso3], ['Numeric', c.numeric_code || '—'],
    ['Phone', c.phone_code || '—'], ['Currency Code', c.currency_code || '—'], ['Currency Symbol', c.currency_symbol || '—'],
    ['Currency Name', c.currency_name || '—'], ['Capital', c.capital || '—'], ['Region', c.region || '—'],
    ['Subregion', c.subregion || '—'], ['Population', c.population?.toLocaleString() || '—'], ['Timezone', c.timezones?.[0] || '—'],
  ]

  return (
    <>
      <div className="hidden md:block bg-white border border-gray-100 rounded-2xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead style={{ backgroundColor: theme?.table_header_bg || '#f9fafb' }}>
            <tr>{HEADERS.map(h => (
              <th key={h} className="text-left px-3 py-3 text-xs font-semibold whitespace-nowrap" style={{ color: theme?.table_header_text || '#6b7280' }}>{h}</th>
            ))}</tr>
          </thead>
          <tbody>
            {rows.map(c => (
              <tr key={c.id} className="border-t border-gray-50 hover:bg-gray-50">
                <td className="px-3 py-3">{c.flag_url ? <Image src={c.flag_url} alt={c.name} width={28} height={20} unoptimized /> : <span>{c.flag_emoji}</span>}</td>
                <td className="px-3 py-3 font-medium whitespace-nowrap" style={{ color: textPrimary }}>{c.name}</td>
                {fields(c).map(([label, value]) => (
                  <td key={label} className="px-3 py-3 whitespace-nowrap" style={{ color: textMuted }}>{value}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="md:hidden flex flex-col gap-3">
        {rows.map(c => (
          <div key={c.id} className="bg-white border border-gray-100 rounded-2xl p-4 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              {c.flag_url ? <Image src={c.flag_url} alt={c.name} width={28} height={20} unoptimized /> : <span>{c.flag_emoji}</span>}
              <span className="font-semibold" style={{ color: textPrimary }}>{c.name}</span>
            </div>
            <div className="rounded-xl bg-gray-50 px-3 py-2 flex flex-col gap-1">
              {fields(c).map(([label, value]) => (
                <div key={label} className="flex justify-between text-xs gap-2">
                  <span className="shrink-0" style={{ color: textMuted }}>{label}</span>
                  <span className="text-right" style={{ color: textPrimary }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </>
  )
}
