import type { ModuleType } from '@/lib/supabase/types';
import type { ContextSource } from '@/lib/rag/context-builder';

export interface AgentToolResult {
  success: boolean;
  chunks?: Array<{ content: string; source: string; similarity: number }>;
  error?: string;
}

export interface ToolCall {
  name: string;
  args: Record<string, unknown>;
  result?: AgentToolResult;
}

export interface AgentStreamChunk {
  type: 'text' | 'tool_call' | 'sources' | 'done' | 'error';
  content?: string;
  toolCall?: ToolCall;
  sources?: ContextSource[];
  logId?: string;
  error?: string;
}

export interface AgentContext {
  query: string;
  module: ModuleType;
  sessionId?: string;
}
