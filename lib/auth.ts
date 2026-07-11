import { jwtVerify } from 'jose';
import { NextRequest } from 'next/server';

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