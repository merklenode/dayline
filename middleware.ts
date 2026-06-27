import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const secret = process.env.INTERNAL_API_SECRET;
if (!secret) throw new Error('INTERNAL_API_SECRET is required');

async function timingSafeEqual(a: string, b: string): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    'raw',
    crypto.getRandomValues(new Uint8Array(32)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const enc = new TextEncoder();
  const [sigA, sigB] = await Promise.all([
    crypto.subtle.sign('HMAC', key, enc.encode(a)),
    crypto.subtle.sign('HMAC', key, enc.encode(b)),
  ]);
  const a8 = new Uint8Array(sigA);
  const b8 = new Uint8Array(sigB);
  let diff = 0;
  for (let i = 0; i < a8.length; i++) diff |= a8[i] ^ b8[i];
  return diff === 0;
}

export async function middleware(request: NextRequest) {
  const auth = request.headers.get('authorization') ?? '';
  if (!(await timingSafeEqual(auth, `Bearer ${secret}`))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/locusgraph/:path*',
};
