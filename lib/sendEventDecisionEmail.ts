// THIS FILE GOES IN: lib/sendEventDecisionEmail.ts (NEW FILE)
import { supabaseAdmin } from '@/lib/supabaseAdmin'
import { sendEntityStatusEmail } from '@/lib/sendEntityStatusEmail'

const slugify = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

// Emails the organiser about an Admin decision. Never blocks the decision if it fails.
export async function sendEventDecisionEmail(event: any, decision: 'approved' | 'rejected', isCorrection: boolean, reasonId?: string, reasonNote?: string) {
  try {
    const { data: entity } = await supabaseAdmin.from('entities').select('user_id, display_name, slug').eq('id', event.entity_id).maybeSingle()
    if (!entity) return
    const { data: user } = await supabaseAdmin.from('users').select('email').eq('id', entity.user_id).maybeSingle()
    if (!user?.email) return
    let reason = reasonNote || ''
    if (reasonId) {
      const { data: row } = await supabaseAdmin.from('module_status_reasons').select('reason_label').eq('id', reasonId).maybeSingle()
      if (row?.reason_label) reason = reasonNote ? `${row.reason_label} — ${reasonNote}` : row.reason_label
    }
    const type = decision === 'approved' ? (isCorrection ? 'event_correction_approved' : 'event_approved') : (isCorrection ? 'event_correction_rejected' : 'event_rejected')
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'
    const approved = decision === 'approved'
    await sendEntityStatusEmail({
      to: user.email, name: entity.display_name, type,
      reason: `${event.name} (${event.process_id})${reason ? ` — ${reason}` : ''}`,
      buttonLabel: approved ? 'Open Event' : 'Edit Event',
      buttonUrl: `${baseUrl}/biz/${entity.slug || slugify(entity.display_name)}/events/create?ref=${event.process_id}`,
    })
  } catch (err) { console.error('[sendEventDecisionEmail] Failed:', err) }
}