import type { MatchedChunk } from '@/lib/supabase/types';
import { MAX_CONTEXT_TOKENS } from '@/lib/utils/constants';

export interface ContextSource {
  chunkId: string;
  docTitle: string;
  docType: string;
  similarity: number;
  excerpt: string;
}

export function buildContext(
  chunks: MatchedChunk[],
  maxTokens = MAX_CONTEXT_TOKENS
): string {
  let context = '';
  let estimatedTokens = 0;

  for (const chunk of chunks) {
    // Rough token estimate: 1 token ≈ 4 characters
    const chunkTokens = Math.ceil(chunk.content.length / 4);
    if (estimatedTokens + chunkTokens > maxTokens) break;

    const source = `[Source: ${chunk.doc_title} | Similarity: ${(chunk.similarity * 100).toFixed(1)}%]`;
    context += `${source}\n${chunk.content}\n\n`;
    estimatedTokens += chunkTokens + 10;
  }

  return context.trim();
}

export function extractSources(chunks: MatchedChunk[]): ContextSource[] {
  return chunks.map((chunk) => ({
    chunkId: chunk.id,
    docTitle: chunk.doc_title,
    docType: chunk.doc_type,
    similarity: chunk.similarity,
    excerpt: chunk.content.slice(0, 200).trim() + (chunk.content.length > 200 ? '…' : ''),
  }));
}
