// THIS FILE GOES IN: lib/safeNext.ts (NEW FILE)
// Used by Login, Register and Profile Edit to decide where to send a person back to.
// Accepts an address ONLY if it stays inside Orgzify (starts with a single "/").
// Anything pointing to another website, or empty, gives null.
export function safeNext(value: string | null | undefined): string | null {
  if (!value) return null
  if (!value.startsWith('/')) return null
  if (value.startsWith('//') || value.includes('\\')) return null
  return value
}
