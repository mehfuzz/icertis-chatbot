import { embedQuery } from '@/lib/gemini/embeddings';
import { streamResponse } from '@/lib/gemini/streaming';
import { searchCustomQueries, searchDocumentChunks } from './retriever';
import { buildContext, extractSources, type ContextSource } from './context-builder';
import { rerank } from './reranker';
import { getSystemPrompt, buildRAGPrompt, buildFallbackPrompt } from './prompts';
import { createServerClient } from '@/lib/supabase/server';
import type { ModuleType, ResponseType } from '@/lib/supabase/types';

export type StreamChunkType = 'text' | 'sources' | 'done' | 'error';

export interface StreamChunk {
  type: StreamChunkType;
  content?: string;
  sources?: ContextSource[];
  logId?: string;
  error?: string;
  responseType?: ResponseType;
}

export async function* runRAGPipeline(
  query: string,
  module: ModuleType,
  sessionId?: string
): AsyncGenerator<StreamChunk> {
  const startTime = Date.now();
  let responseType: ResponseType = 'rag';
  let fullResponse = '';
  let sources: ContextSource[] = [];

  try {
    // Step 1: Embed the user query
    const queryEmbedding = await embedQuery(query);

    // Step 2: Search custom query memory (FAQ / known issues)
    const customMatches = await searchCustomQueries(queryEmbedding, module);

    if (customMatches.length > 0) {
      // High-confidence match found in custom query memory
      responseType = 'custom_query';
      const best = customMatches[0];
      fullResponse = best.answer_text;

      // Increment hit count asynchronously (fire and forget)
      const supabase = createServerClient();
      supabase
        .from('custom_queries')
        .update({ hit_count: (best.hit_count ?? 0) + 1 })
        .eq('id', best.id)
        .then(() => {});

      // Stream the stored answer character by character for UX consistency
      for (const char of best.answer_text) {
        yield { type: 'text', content: char };
      }

      yield { type: 'sources', sources: [] };

      const logId = await saveQueryLog({
        sessionId,
        query,
        response: fullResponse,
        responseType,
        sources: [],
        latencyMs: Date.now() - startTime,
      });

      yield { type: 'done', logId, responseType };
      return;
    }

    // Step 3: Search document chunks (RAG)
    const rawChunks = await searchDocumentChunks(queryEmbedding, module);

    if (rawChunks.length === 0) {
      // No relevant documents found — fallback response
      responseType = 'error';
      const fallbackPrompt = buildFallbackPrompt(query, module);
      const systemPrompt = getSystemPrompt(module);

      for await (const text of streamResponse(fallbackPrompt, systemPrompt)) {
        fullResponse += text;
        yield { type: 'text', content: text };
      }

      yield { type: 'sources', sources: [] };

      const logId = await saveQueryLog({
        sessionId,
        query,
        response: fullResponse,
        responseType,
        sources: [],
        latencyMs: Date.now() - startTime,
      });

      // Auto-flag for review when no context found
      await flagForReview(logId, query, fullResponse, 'No relevant documents found above threshold');

      yield { type: 'done', logId, responseType };
      return;
    }

    // Step 4: Re-rank chunks
    const rankedChunks = rerank(rawChunks, query);

    // Step 5: Build context string
    const context = buildContext(rankedChunks);
    sources = extractSources(rankedChunks);

    // Step 6: Build RAG prompt and stream Gemini response
    const ragPrompt = buildRAGPrompt(context, query);
    const systemPrompt = getSystemPrompt(module);

    let sourcesYielded = false;

    for await (const text of streamResponse(ragPrompt, systemPrompt)) {
      fullResponse += text;

      // Yield sources after the first text chunk
      if (!sourcesYielded) {
        yield { type: 'sources', sources };
        sourcesYielded = true;
      }

      yield { type: 'text', content: text };
    }

    if (!sourcesYielded) {
      yield { type: 'sources', sources };
    }

    const logId = await saveQueryLog({
      sessionId,
      query,
      response: fullResponse,
      responseType,
      sources,
      latencyMs: Date.now() - startTime,
    });

    yield { type: 'done', logId, responseType };
  } catch (err) {
    console.error('RAG pipeline error:', err);
    const errorMsg = err instanceof Error ? err.message : 'Unknown error';
    yield { type: 'error', error: 'Failed to generate response. Please try again.' };

    await saveQueryLog({
      sessionId,
      query,
      response: '',
      responseType: 'error',
      sources: [],
      latencyMs: Date.now() - startTime,
      errorMessage: errorMsg,
    });
  }
}

async function saveQueryLog(params: {
  sessionId?: string;
  query: string;
  response: string;
  responseType: ResponseType;
  sources: ContextSource[];
  latencyMs: number;
  errorMessage?: string;
}): Promise<string> {
  try {
    const supabase = createServerClient();

    let sessionDbId: string | null = null;

    if (params.sessionId) {
      const { data } = await supabase
        .from('chat_sessions')
        .select('id')
        .eq('session_token', params.sessionId)
        .single();
      sessionDbId = data?.id ?? null;

      // Update session last_active
      if (sessionDbId) {
        await supabase
          .from('chat_sessions')
          .update({ last_active: new Date().toISOString() })
          .eq('id', sessionDbId);
      }
    }

    const { data } = await supabase
      .from('query_logs')
      .insert({
        session_id: sessionDbId,
        query_text: params.query,
        response_text: params.response,
        response_type: params.responseType,
        sources: params.sources,
        latency_ms: params.latencyMs,
        error_message: params.errorMessage,
      })
      .select('id')
      .single();

    return data?.id ?? '';
  } catch {
    return '';
  }
}

async function flagForReview(
  logId: string,
  query: string,
  response: string,
  reason: string
): Promise<void> {
  try {
    const supabase = createServerClient();
    await supabase.from('review_queue').insert({
      log_id: logId || null,
      query_text: query,
      response_text: response,
      reason,
    });
  } catch {
    // Non-critical: don't fail the response if flagging fails
  }
}
