import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { embedDocument } from '@/lib/gemini/embeddings';
import type { ModuleType } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const module = searchParams.get('module') as ModuleType | null;
  const activeOnly = searchParams.get('active') !== 'false';

  const supabase = createServerClient();
  let query = supabase
    .from('custom_queries')
    .select('id, query_text, answer_text, module, tags, is_active, hit_count, created_at, updated_at')
    .order('hit_count', { ascending: false });

  if (module) query = query.eq('module', module);
  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ queries: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.query_text || !body?.answer_text) {
    return NextResponse.json(
      { error: 'query_text and answer_text are required' },
      { status: 400 }
    );
  }

  // Generate embedding for the query text
  const queryEmbedding = await embedDocument(body.query_text);

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('custom_queries')
    .insert({
      query_text: body.query_text,
      answer_text: body.answer_text,
      query_embedding: queryEmbedding,
      module: (body.module as ModuleType) ?? 'general',
      tags: body.tags ?? [],
      is_active: body.is_active ?? true,
    })
    .select('id, query_text, answer_text, module, tags, is_active, hit_count, created_at, updated_at')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ query: data }, { status: 201 });
}
