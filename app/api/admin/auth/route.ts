import { type NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.password) {
    return NextResponse.json({ error: 'Password required' }, { status: 400 });
  }

  const adminKey = process.env.ADMIN_SECRET_KEY;
  if (!adminKey) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
  }

  if (body.password !== adminKey) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  }

  const cookieStore = cookies();
  cookieStore.set('admin_token', adminKey, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/',
  });

  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete('admin_token');
  return NextResponse.json({ success: true });
}
