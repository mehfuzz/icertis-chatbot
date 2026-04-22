import type { ModuleType } from '@/lib/supabase/types';

export interface ChatRequest {
  message: string;
  sessionId: string;
  module: ModuleType;
  useAgent?: boolean;
}

export interface FeedbackRequest {
  logId: string;
  feedback: 'positive' | 'negative';
  note?: string;
}

export interface CreateCustomQueryRequest {
  query_text: string;
  answer_text: string;
  module: ModuleType;
  tags?: string[];
}

export interface ResolveReviewItemRequest {
  status: 'resolved' | 'dismissed';
  resolution_note?: string;
  resolved_by?: string;
  push_to_custom_queries?: boolean;
  correct_answer?: string;
  module?: ModuleType;
  tags?: string[];
}
