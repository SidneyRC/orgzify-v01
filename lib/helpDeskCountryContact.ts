// GOES IN: lib/helpDeskCountryContact.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'

const MODULE_CODE_BY_TYPE: Record<string, string> = {
  entity: 'help_desk_entity', staff: 'help_desk_staff', customer: 'help_desk_customer'
}
const FALLBACK_EMAIL = process.env.ZEPTO_FROM_EMAIL_HELPDESK || 'support.donotreply@orgzify.com'

export async function getHelpDeskContactEmail(referenceType: string, reportingCompanyId: string | null): Promise<string> {
  const moduleCode = MODULE_CODE_BY_TYPE[referenceType] || 'help_desk_customer'
  if (!reportingCompanyId) return FALLBACK_EMAIL

  const { data: address } = await supabaseAdmin.from('company_addresses')
    .select('country_id').eq('company_id', reportingCompanyId).eq('address_type', 'registered').maybeSingle()
  if (!address?.country_id) return FALLBACK_EMAIL

  const { data: contact } = await supabaseAdmin.from('module_country_contacts')
    .select('customer_care_email').eq('module_code', moduleCode).eq('country_id', address.country_id).eq('status', 'active').maybeSingle()

  return contact?.customer_care_email || FALLBACK_EMAIL
}
