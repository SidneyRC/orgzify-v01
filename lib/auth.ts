import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';

const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET!);

export async function getSession(req: NextRequest) {
  const token = req.cookies.get('orgzify_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { user_id: string; profile_id: string; is_super_admin?: boolean };
  } catch {
    return null;
  }
}

// Same as getSession, but for server-rendered pages (no NextRequest available
// there) — reads the same cookie via next/headers instead.
export async function getServerSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get('orgzify_token')?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return payload as { user_id: string; profile_id: string; is_super_admin?: boolean };
  } catch {
    return null;
  }
}