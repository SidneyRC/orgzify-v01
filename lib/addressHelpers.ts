// Shared address helpers — used by Entities, Companies, and any future
// module (Venue, etc.) that collects a Pincode + Area + City/District/State.

const DEFAULT_API = '/admin/shared/address/api'

export type AddressLike = {
  pincode: string; area: string
  city_id: string; district_id: string; state_id: string; country_id: string
}

// If this exact pincode + area combination isn't already in the Pincode
// table, save it there now (source: 'user'). Called right before an
// address is saved, so a brand-new pincode/area the user typed in gets
// added to the master Pincode table at the same time as the address.
export async function ensurePincodeSaved(addr: AddressLike, apiBase?: string) {
  const API = apiBase || DEFAULT_API
  if (!addr.pincode || !addr.area || !addr.city_id) return

  const check = await fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'search_pincodes', query: addr.pincode })
  })
  const checkJson = await check.json()
  const match = (checkJson.data || []).find(
    (r: any) => r.pincode === addr.pincode && r.area.trim().toLowerCase() === addr.area.trim().toLowerCase()
  )

  if (match) {
    // Row already exists — if City/District/State/Country have changed
    // since it was first saved, correct it instead of silently keeping
    // the old (possibly wrong) values forever.
    const changed = match.city_id !== addr.city_id || match.district_id !== addr.district_id
      || match.state_id !== addr.state_id || match.country_id !== addr.country_id
    if (changed) {
      await fetch(API, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'update_pincode', id: match.id,
          city_id: addr.city_id, district_id: addr.district_id,
          state_id: addr.state_id, country_id: addr.country_id
        })
      })
    }
    return
  }

  await fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'add_pincode', pincode: addr.pincode, area: addr.area,
      city_id: addr.city_id, district_id: addr.district_id,
      state_id: addr.state_id, country_id: addr.country_id
    })
  })
}

// Batch-resolves City/District/State names from their IDs — used when
// reopening a saved address, so the boxes show names instead of being blank.
export async function getLocationNames(ids: string[], apiBase?: string): Promise<Record<string, string>> {
  const API = apiBase || DEFAULT_API
  const clean = ids.filter(Boolean)
  if (clean.length === 0) return {}
  const res = await fetch(API, {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'get_location_names', ids: clean })
  })
  const json = await res.json()
  return json.data || {}
}