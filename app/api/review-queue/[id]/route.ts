import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { embedDocument } from '@/lib/gemini/embeddings';
import type { ModuleType } from '@/lib/supabase/types';

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

  const supabase = createServerClient();

  const updates: Record<string, unknown> = {
    status: body.status ?? 'resolved',
    resolution_note: body.resolution_note ?? null,
    resolved_by: body.resolved_by ?? 'admin',
    resolved_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from('review_queue')
    .update(updates)
    .eq('id', params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // If resolved with a correct answer, optionally push to custom_queries
  if (body.status === 'resolved' && body.push_to_custom_queries && body.correct_answer) {
    const reviewItem = data;
    const queryEmbedding = await embedDocument(reviewItem.query_text);

    await supabase.from('custom_queries').insert({
      query_text: reviewItem.query_text,
      answer_text: body.correct_answer,
      query_embedding: queryEmbedding,
      module: (body.module as ModuleType) ?? 'general',
      tags: body.tags ?? [],
    });
  }

  return NextResponse.json({ item: data });
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createServerClient();
  const { error } = await supabase
    .from('review_queue')
    .update({ status: 'dismissed', resolved_at: new Date().toISOString() })
    .eq('id', params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
