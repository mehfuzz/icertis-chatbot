import type { MatchedChunk } from '@/lib/supabase/types';

// Lightweight re-ranker: boosts chunks based on query term overlap
// This improves ranking when similarity scores are close
export function rerank(chunks: MatchedChunk[], query: string): MatchedChunk[] {
  if (chunks.length <= 1) return chunks;

  const queryTerms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((t) => t.length > 3);

  return chunks
    .map((chunk) => {
      const contentLower = chunk.content.toLowerCase();
      const termOverlap = queryTerms.filter((term) =>
        contentLower.includes(term)
      ).length;

      // Blend similarity score with term overlap bonus (max +0.05)
      const termBonus =
        queryTerms.length > 0 ? (termOverlap / queryTerms.length) * 0.05 : 0;

      return { ...chunk, similarity: chunk.similarity + termBonus };
    })
    .sort((a, b) => b.similarity - a.similarity);
}
