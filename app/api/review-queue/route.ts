import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status') ?? 'pending';

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('review_queue')
    .select('*')
    .eq('status', status)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ items: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.query_text) {
    return NextResponse.json({ error: 'query_text is required' }, { status: 400 });
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('review_queue')
    .insert({
      log_id: body.log_id ?? null,
      query_text: body.query_text,
      response_text: body.response_text ?? null,
      reason: body.reason ?? 'Manually flagged',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ item: data }, { status: 201 });
}
