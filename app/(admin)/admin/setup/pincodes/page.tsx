import type { Metadata } from 'next'
import OREV1046PincodesPage from '@/components/admin/OREV1-046-PincodesPage'

export const metadata: Metadata = {
  title: 'Pincodes | Orgzify Admin',
  description: 'Manage pincode master data — add, edit, verify pincodes',
  openGraph: {
    title: 'Pincodes | Orgzify Admin',
    description: 'Manage pincode master data',
  },
}

export default function PincodesPage() {
  return <OREV1046PincodesPage />
}