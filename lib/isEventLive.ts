// THIS FILE GOES IN: lib/isEventLive.ts (NEW FILE)
// ONE rule for "a live public event", written as a database filter.
// Same rule as app/sitemap.ts and lib/checkEventVisibility.ts:
// active + published + public + not cancelled + approved at least once.
// Note: an event with an empty event_status still counts as live
// (a plain "not cancelled" filter would wrongly drop it).
// Used by lib/getRelatedEvents.ts (You May Also Like).
// Later the city picker can use it too, so both always agree.
// Usage: applyLiveEventFilter(supabaseAdmin.from('events').select('...'))

export function applyLiveEventFilter(query: any) {
  return query
    .eq('status', 'active')
    .eq('published', true)
    .eq('visibility', 'public')
    .or('event_status.is.null,event_status.neq.cancelled')
    .not('approved_at', 'is', null)
}
