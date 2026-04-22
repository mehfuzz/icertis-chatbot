import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { embedDocument } from '@/lib/gemini/embeddings';

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const updates: Record<string, unknown> = { ...body };

  // Re-generate embedding if query text changed
  if (body.query_text) {
    updates.query_embedding = await embedDocument(body.query_text);
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('custom_queries')
    .update(updates)
    .eq('id', params.id)
    .select('id, query_text, answer_text, module, tags, is_active, hit_count, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ query: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('custom_queries')
    .delete()
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
