import { redirect } from 'next/navigation'
import { getServerSession } from '@/lib/auth'
import { supabaseAdmin } from '@/lib/supabaseAdmin'

export default async function AdminGroupLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession()
  if (!session) redirect('/login')

  if (!session.is_super_admin) {
    const { data: roleRow } = await supabaseAdmin
      .from('user_roles').select('id').eq('user_id', session.user_id).eq('is_active', true).maybeSingle()
    if (!roleRow) redirect('/access-denied')
  }

  return <>{children}</>
}