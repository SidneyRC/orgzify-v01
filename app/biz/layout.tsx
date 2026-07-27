import { headers } from 'next/headers';
import BizShell from '@/components/shared/OREV1-069-BizShell';

export default async function BizLayout({ children }: { children: React.ReactNode }) {
  const headersList = await headers();
  const cookieHeader = headersList.get('cookie') ?? '';

  const getCookie = (cookie: string, name: string) => {
    const match = cookie.match(new RegExp('(^|;\\s*)' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : '';
  };

  const initialName = getCookie(cookieHeader, 'zy_display');
  const initialAvatar = getCookie(cookieHeader, 'zy_avatar');

  return (
    <BizShell initialName={initialName} initialAvatar={initialAvatar}>
      {children}
    </BizShell>
  );
}
