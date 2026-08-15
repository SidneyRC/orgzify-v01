// GOES IN: lib/countriesSyncHelpers.ts
export type CountryRow = {
  name: string; official_name: string; iso2: string; iso3: string; numeric_code: string
  phone_code: string; currency_code: string; currency_name: string; currency_symbol: string
  capital: string; region: string; subregion: string; population: number
  flag_url: string; flag_emoji: string; timezones: string[]
}

// Converts one country object from the new api.restcountries.com/v5 shape
// into the flat row shape our country_master table uses.
export function mapApiCountryToRow(c: any): CountryRow {
  const currencies = c.currencies || {}
  const currencyCode = Object.keys(currencies)[0] || ''
  const currency = currencyCode ? currencies[currencyCode] : null
  const rawCalling = c.calling_codes?.[0]
  const callingCode = rawCalling ? (String(rawCalling).startsWith('+') ? String(rawCalling) : `+${rawCalling}`) : ''

  return {
    name: c.names?.common || '',
    official_name: c.names?.official || '',
    iso2: c.codes?.alpha_2 || '',
    iso3: c.codes?.alpha_3 || '',
    numeric_code: c.codes?.ccn3 || '',
    phone_code: callingCode,
    currency_code: currencyCode,
    currency_name: currency?.name || '',
    currency_symbol: currency?.symbol || '',
    capital: c.capitals?.[0]?.name || '',
    region: c.region || '',
    subregion: c.subregion || '',
    population: c.population || 0,
    flag_url: c.flag?.url_png || '',
    flag_emoji: c.flag?.emoji || '',
    timezones: c.timezones || [],
  }
}

// Fields we compare to decide if an existing row actually needs updating.
// iso2 is deliberately excluded — it's the match key, not a "did it change" field.
const COMPARE_FIELDS: (keyof CountryRow)[] = [
  'name', 'official_name', 'iso3', 'numeric_code', 'phone_code',
  'currency_code', 'currency_name', 'currency_symbol', 'capital',
  'region', 'subregion', 'population', 'flag_url', 'flag_emoji',
]

export function hasChanges(existing: any, incoming: CountryRow): boolean {
  return COMPARE_FIELDS.some(f => JSON.stringify(existing[f]) !== JSON.stringify(incoming[f]))
}
