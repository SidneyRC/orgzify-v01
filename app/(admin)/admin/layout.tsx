import { headers } from 'next/headers';
import AdminShell from '@/components/admin/OREV1-042-AdminShell';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie') ?? '';

  const getCookie = (cookie: string, name: string) => {
    const match = cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
  };

  const initialName   = getCookie(cookieHeader, 'zy_display');
  const initialAvatar = getCookie(cookieHeader, 'zy_avatar');

  return (
    <AdminShell initialName={initialName} initialAvatar={initialAvatar}>
      {children}
    </AdminShell>
  );
}
