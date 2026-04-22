import type { ModuleType, ResponseType, FeedbackType } from '@/lib/supabase/types';

export type { ModuleType, ResponseType, FeedbackType };

export interface Source {
  chunkId: string;
  docTitle: string;
  docType: string;
  similarity: number;
  excerpt: string;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: Source[];
  logId?: string;
  feedback?: FeedbackType;
  timestamp: Date;
  isStreaming?: boolean;
  responseType?: ResponseType;
  error?: boolean;
}

export interface StreamChunk {
  type: 'text' | 'sources' | 'done' | 'error' | 'tool_call';
  content?: string;
  sources?: Source[];
  logId?: string;
  error?: string;
  responseType?: ResponseType;
}
