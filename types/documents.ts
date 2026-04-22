import type { DocumentRow, DocumentChunkRow } from '@/lib/supabase/types';

export type { DocumentRow, DocumentChunkRow };

export interface DocumentUploadForm {
  title: string;
  module: 'icm' | 'oracle' | 'general';
  file: File;
}
