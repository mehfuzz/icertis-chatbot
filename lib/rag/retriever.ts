import { createServerClient } from '@/lib/supabase/server';
import type { MatchedChunk, MatchedCustomQuery, ModuleType } from '@/lib/supabase/types';
import { RAG_THRESHOLD, RAG_TOP_K, CUSTOM_QUERY_THRESHOLD } from '@/lib/utils/constants';

export async function searchCustomQueries(
  embedding: number[],
  module?: ModuleType,
  threshold = CUSTOM_QUERY_THRESHOLD,
  count = 3
): Promise<MatchedCustomQuery[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc('match_custom_queries', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: count,
    filter_module: module === 'general' ? null : (module ?? null),
  });

  if (error) {
    console.error('Custom query search error:', error);
    return [];
  }

  return (data ?? []) as MatchedCustomQuery[];
}

export async function searchDocumentChunks(
  embedding: number[],
  module?: ModuleType,
  threshold = RAG_THRESHOLD,
  count = RAG_TOP_K
): Promise<MatchedChunk[]> {
  const supabase = createServerClient();

  const { data, error } = await supabase.rpc('match_document_chunks', {
    query_embedding: embedding,
    match_threshold: threshold,
    match_count: count,
    filter_module: module === 'general' ? null : (module ?? null),
  });

  if (error) {
    console.error('Document chunk search error:', error);
    return [];
  }

  return (data ?? []) as MatchedChunk[];
}

export async function incrementCustomQueryHitCount(id: string, currentCount: number): Promise<void> {
  const supabase = createServerClient();
  // Non-critical — fire and forget, no await
  supabase
    .from('custom_queries')
    .update({ hit_count: currentCount + 1 })
    .eq('id', id)
    .then(() => {});
}
