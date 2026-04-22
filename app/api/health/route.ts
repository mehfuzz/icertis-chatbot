import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

// Diagnostic endpoint: visit /api/health to check env vars and Supabase connectivity.
export async function GET() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '(not set)';
  const hasServiceKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY;
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;

  // Show the actual URL the PostgREST client will use
  const resolvedUrl = supabaseUrl.replace(/\/$/, '');
  const restUrl = `${resolvedUrl}/rest/v1/documents?select=id&limit=1`;

  // Try a real query
  let dbStatus: string;
  let dbError: string | null = null;
  try {
    const supabase = createServerClient();
    const { error } = await supabase.from('documents').select('id').limit(1);
    dbStatus = error ? 'error' : 'ok';
    dbError = error?.message ?? null;
  } catch (e) {
    dbStatus = 'exception';
    dbError = e instanceof Error ? e.message : String(e);
  }

  return NextResponse.json({
    env: {
      NEXT_PUBLIC_SUPABASE_URL: supabaseUrl,
      resolvedRestUrl: restUrl,
      hasServiceKey,
      hasGeminiKey,
    },
    db: { status: dbStatus, error: dbError },
  });
}
