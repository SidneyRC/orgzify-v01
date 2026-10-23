// THIS FILE GOES IN: lib/eventBundleLiveOverrides.ts (REPLACES existing file)
// Live layer applied on top of the approved snapshot for fields that update
// the public page instantly, with no approval needed: Quantity, sold count,
// Fast selling and Status (on/off). Price and identity fields are NOT here —
// those stay snapshot-only until the next approval.
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function buildLiveTicketOverrides(slotIds: string[]) {
  if (!slotIds.length) return {}
  const { data: assigned } = await supabaseAdmin
    .from('event_ticket_assignments')
    .select('event_venue_time_id, ticket_type_id, quantity, sold_count, is_enabled, fast_selling_forced')
    .in('event_venue_time_id', slotIds)

  const overrides: Record<string, any> = {}
  for (const a of assigned || []) {
    const key = `${a.event_venue_time_id}_${a.ticket_type_id}`
    const autoFast = a.quantity > 0 && (a.sold_count / a.quantity) >= 0.9
    overrides[key] = {
      quantity: a.quantity,
      soldCount: a.sold_count,
      fastFilling: !!a.fast_selling_forced || autoFast,
      isEnabled: a.is_enabled,
    }
  }
  return overrides
}

// Public-page session rules, applied after switched-off tickets are removed:
// - a ticket with every seat sold gets soldOut = true (it stays visible)
// - a session with no tickets left (all switched off) is hidden
// - "onwards" price counts only tickets that are open and not sold out
// - noSessionsLeft = true when every upcoming session got hidden
export function applyLiveSessionRules(snapshot: any, ticketsBySlot: Record<string, any[]>) {
  const tagged: Record<string, any[]> = {}
  for (const id of Object.keys(ticketsBySlot)) {
    tagged[id] = ticketsBySlot[id].map((t: any) => ({ ...t, soldOut: t.quantity > 0 && t.soldCount >= t.quantity }))
  }
  const before: string[] | undefined = snapshot.upcomingSlotIds
  const visible = (before || []).filter((id) => (tagged[id] || []).length > 0)
  const hasFastFilling = visible.some((id) => tagged[id].some((t: any) => t.fastFilling && !t.soldOut))
  if (!before) return { ticketsBySlot: tagged, hasFastFilling }

  const prices = visible.flatMap((id) => tagged[id].filter((t: any) => !t.soldOut).map((t: any) => t.price))
  const next = visible.includes(snapshot.nextUpcomingSlotId) ? snapshot.nextUpcomingSlotId : visible[0] || snapshot.nextUpcomingSlotId
  return {
    ticketsBySlot: tagged,
    hasFastFilling,
    upcomingSlotIds: visible,
    nextUpcomingSlotId: next,
    noSessionsLeft: before.length > 0 && visible.length === 0,
    lowestActivePrice: prices.length ? Math.min(...prices) : null,
  }
}
