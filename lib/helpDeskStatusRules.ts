// GOES IN: lib/helpDeskStatusRules.ts
// Single source of truth for which status a ticket can move to, based on where it is now.

const MIDDLE_GROUP = ['pending', 'correction', 'resubmitted', 'escalate', 'closed']

export function allowedNextStatuses(currentStatus: string): string[] {
  if (currentStatus === 'closed') return ['closed', 'reopened']
  if (currentStatus === 'new' || currentStatus === 'reopened') return MIDDLE_GROUP
  // pending / correction / resubmitted / escalate
  return MIDDLE_GROUP
}

export function isValidTransition(currentStatus: string, nextStatus: string): boolean {
  return allowedNextStatuses(currentStatus).includes(nextStatus)
}

// Statuses that auto-trigger an email to whoever raised the ticket
export const EMAIL_TRIGGER_STATUSES = ['correction', 'closed', 'reopened']

// Statuses selectable when FIRST creating a ticket — nothing can be "Reopened" before it exists
export const CREATE_SELECTABLE_STATUSES = ['new', 'pending', 'correction', 'resubmitted', 'escalate', 'closed']
