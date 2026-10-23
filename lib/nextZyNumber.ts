// THIS FILE GOES IN: lib/nextZyNumber.ts (NEW FILE)
// Next free ZY number = highest number already used + 1.
// (Counting users and adding 1 repeats an old number after any user is deleted.)
// Reads in pages of 1000 so it keeps working as the user list grows.
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function nextZyNumber(): Promise<number> {
  let max = 0
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabaseAdmin.from('users').select('zy_id').order('id').range(from, from + 999)
    if (error) throw new Error('nextZyNumber: ' + error.message)
    if (!data || data.length === 0) break
    for (const u of data) {
      const n = parseInt(String(u.zy_id || '').replace(/\D/g, ''), 10)
      if (n > max) max = n
    }
    if (data.length < 1000) break
  }
  return max + 1
}
