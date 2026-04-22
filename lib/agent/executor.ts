import { gemini } from '@/lib/gemini/client';
import { TOOL_DECLARATIONS } from '@/lib/gemini/functions';
import { executeTool } from './tools';
import { getSystemPrompt } from '@/lib/rag/prompts';
import { createServerClient } from '@/lib/supabase/server';
import type { AgentContext, AgentStreamChunk, ToolCall } from './types';
import type { ContextSource } from '@/lib/rag/context-builder';
import { AGENT_MAX_ITERATIONS } from '@/lib/utils/constants';

export async function* runAgent(
  ctx: AgentContext
): AsyncGenerator<AgentStreamChunk> {
  const { query, module, sessionId } = ctx;
  const startTime = Date.now();
  const allToolCalls: ToolCall[] = [];
  const allSources: ContextSource[] = [];
  let fullResponse = '';

  try {
    const chatModel = process.env.GEMINI_CHAT_MODEL ?? 'gemini-2.5-flash';
    const model = gemini.getGenerativeModel(
      {
        model: chatModel,
        tools: [{ functionDeclarations: TOOL_DECLARATIONS }],
        systemInstruction: getSystemPrompt(module),
        generationConfig: { temperature: 0.3, topP: 0.95, maxOutputTokens: 2048 },
      },
      { apiVersion: 'v1' }
    );

    const chat = model.startChat({ history: [] });
    let result = await chat.sendMessage(query);

    for (let iteration = 0; iteration < AGENT_MAX_ITERATIONS; iteration++) {
      const candidate = result.response.candidates?.[0];
      if (!candidate) break;

      const parts = candidate.content.parts;

      // Collect function calls from this response
      const functionCalls = parts
        .filter((p) => p.functionCall)
        .map((p) => p.functionCall!);

      if (functionCalls.length === 0) {
        // No more tool calls — this is the final text response
        const text = result.response.text();
        fullResponse = text;

        // Yield sources before text
        if (allSources.length > 0) {
          yield { type: 'sources', sources: allSources };
        }

        // Stream text character by character for UX
        for (const char of text) {
          yield { type: 'text', content: char };
        }
        break;
      }

      // Execute tool calls sequentially (yield is not allowed inside Promise.all callbacks)
      const toolResults = [];
      for (const fc of functionCalls) {
        const toolCall: ToolCall = {
          name: fc.name,
          args: fc.args as Record<string, unknown>,
        };

        yield { type: 'tool_call', toolCall };

        const toolResult = await executeTool(fc.name, fc.args as Record<string, unknown>);
        toolCall.result = toolResult;
        allToolCalls.push(toolCall);

        // Collect unique sources from tool results
        if (toolResult.success && toolResult.chunks) {
          toolResult.chunks.forEach((chunk) => {
            if (!allSources.find((s) => s.docTitle === chunk.source)) {
              allSources.push({
                chunkId: '',
                docTitle: chunk.source,
                docType: 'pdf',
                similarity: chunk.similarity,
                excerpt: chunk.content.slice(0, 200) + '…',
              });
            }
          });
        }

        toolResults.push({
          functionResponse: {
            name: fc.name,
            response: {
              content: toolResult.success
                ? JSON.stringify(toolResult.chunks?.map((c) => ({ content: c.content, source: c.source })))
                : toolResult.error,
            },
          },
        });
      }

      // Send tool results back to Gemini
      result = await chat.sendMessage(toolResults);
    }

    const logId = await saveAgentLog({
      sessionId,
      query,
      response: fullResponse,
      toolCalls: allToolCalls,
      sources: allSources,
      latencyMs: Date.now() - startTime,
    });

    yield { type: 'done', logId, sources: allSources };
  } catch (err) {
    console.error('Agent executor error:', err);
    yield {
      type: 'error',
      error: 'Agent encountered an error. Please try again.',
    };
  }
}

async function saveAgentLog(params: {
  sessionId?: string;
  query: string;
  response: string;
  toolCalls: ToolCall[];
  sources: ContextSource[];
  latencyMs: number;
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
    }

    const { data } = await supabase
      .from('query_logs')
      .insert({
        session_id: sessionDbId,
        query_text: params.query,
        response_text: params.response,
        response_type: 'agent',
        sources: params.sources,
        tool_calls: params.toolCalls,
        latency_ms: params.latencyMs,
      })
      .select('id')
      .single();

    return data?.id ?? '';
  } catch {
    return '';
  }
}
