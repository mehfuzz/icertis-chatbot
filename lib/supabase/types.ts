export type DocumentType = 'pdf' | 'text' | 'video';
export type ModuleType = 'icm' | 'oracle' | 'general';
export type ResponseType = 'custom_query' | 'rag' | 'agent' | 'error';
export type FeedbackType = 'positive' | 'negative';
export type ReviewStatus = 'pending' | 'resolved' | 'dismissed';

export interface DocumentRow {
  id: string;
  title: string;
  file_name: string;
  file_type: DocumentType;
  module: ModuleType;
  file_url?: string;
  file_size?: number;
  chunk_count: number;
  status: 'processing' | 'ready' | 'failed';
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface DocumentChunkRow {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  embedding?: number[];
  module: ModuleType;
  metadata: Record<string, unknown>;
  token_count?: number;
  created_at: string;
}

export interface CustomQueryRow {
  id: string;
  query_text: string;
  answer_text: string;
  query_embedding?: number[];
  module: ModuleType;
  tags: string[];
  is_active: boolean;
  hit_count: number;
  created_at: string;
  updated_at: string;
}

export interface ChatSessionRow {
  id: string;
  session_token: string;
  title?: string;
  module: ModuleType;
  message_count: number;
  created_at: string;
  last_active: string;
}

export interface QueryLogRow {
  id: string;
  session_id?: string;
  query_text: string;
  response_text?: string;
  response_type: ResponseType;
  sources: unknown[];
  feedback?: FeedbackType;
  feedback_note?: string;
  latency_ms?: number;
  tool_calls: unknown[];
  error_message?: string;
  created_at: string;
}

export interface ReviewQueueRow {
  id: string;
  log_id?: string;
  query_text: string;
  response_text?: string;
  reason?: string;
  status: ReviewStatus;
  resolution_note?: string;
  resolved_by?: string;
  created_at: string;
  resolved_at?: string;
}

export interface MatchedChunk {
  id: string;
  document_id: string;
  content: string;
  chunk_index: number;
  module: ModuleType;
  metadata: Record<string, unknown>;
  similarity: number;
  doc_title: string;
  doc_type: DocumentType;
}

export interface MatchedCustomQuery {
  id: string;
  query_text: string;
  answer_text: string;
  module: ModuleType;
  tags: string[];
  similarity: number;
  hit_count: number;
}
