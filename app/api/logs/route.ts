import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get('page') ?? '1', 10);
  const limit = parseInt(searchParams.get('limit') ?? '50', 10);
  const responseType = searchParams.get('type');
  const offset = (page - 1) * limit;

  const supabase = createServerClient();
  let query = supabase
    .from('query_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (responseType) query = query.eq('response_type', responseType);

  const { data, error, count } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    logs: data,
    total: count,
    page,
    limit,
    totalPages: Math.ceil((count ?? 0) / limit),
  });
}
