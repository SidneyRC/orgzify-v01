import type { Metadata } from 'next'
import OREV1047ACompanyWizard from '@/components/admin/OREV1-047A-CompanyWizard'

export const metadata: Metadata = {
  title: 'New Company | Orgzify Admin',
  description: 'Create a new company on the Orgzify platform',
  openGraph: {
    title: 'New Company | Orgzify Admin',
    description: 'Create a new company',
  },
}

export default function NewCompanyPage() {
  return <OREV1047ACompanyWizard />
}
