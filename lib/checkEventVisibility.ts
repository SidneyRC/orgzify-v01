// lib/checkEventVisibility.ts
// Decides whether the current viewer is allowed to see this event.
// Preview access (via process_id link) always passes.
// Public access (via slug link) must meet all live-event conditions.

export function checkEventVisibility(event: any): boolean {
  if (event.accessType === 'preview') return true

  return (
    event.status === 'active' &&
    event.published === true &&
    event.visibility === 'public' &&
    event.event_status !== 'cancelled'
  )
}
