import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { ModuleType } from '@/lib/supabase/types';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const sessionToken = body.sessionToken;
  const module: ModuleType = body.module ?? 'general';

  if (!sessionToken) {
    return NextResponse.json({ error: 'sessionToken is required' }, { status: 400 });
  }

  const supabase = createServerClient();

  // Upsert session — create if new, update last_active if existing
  const { data, error } = await supabase
    .from('chat_sessions')
    .upsert(
      { session_token: sessionToken, module, last_active: new Date().toISOString() },
      { onConflict: 'session_token' }
    )
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ session: data });
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionToken = searchParams.get('token');

  if (!sessionToken) {
    return NextResponse.json({ error: 'token is required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data: session } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('session_token', sessionToken)
    .single();

  if (!session) return NextResponse.json({ logs: [] });

  const { data: logs } = await supabase
    .from('query_logs')
    .select('id, query_text, response_text, response_type, sources, feedback, created_at')
    .eq('session_id', session.id)
    .order('created_at', { ascending: true });

  return NextResponse.json({ session, logs: logs ?? [] });
}
