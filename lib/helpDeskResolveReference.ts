// GOES IN: lib/helpDeskResolveReference.ts
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export async function resolveReference(referenceType: string, referenceId: string | null) {
  if (!referenceId) return { label: '—', openUrl: null as string | null }

  if (referenceType === 'entity') {
    const { data } = await supabaseAdmin.from('entities').select('display_name, slug').eq('id', referenceId).maybeSingle()
    return { label: data?.display_name || '—', openUrl: data?.slug ? `/biz/${data.slug}/dashboard` : null }
  }
  if (referenceType === 'staff') {
    const { data } = await supabaseAdmin.from('admin_staff').select('name').eq('id', referenceId).maybeSingle()
    return { label: data?.name || '—', openUrl: null }
  }
  if (referenceType === 'customer') {
    const { data } = await supabaseAdmin.from('profiles').select('full_name').eq('id', referenceId).maybeSingle()
    return { label: data?.full_name || '—', openUrl: null }
  }
  return { label: '—', openUrl: null }
}
