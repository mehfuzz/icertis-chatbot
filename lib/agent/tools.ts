import { embedQuery } from '@/lib/gemini/embeddings';
import { searchDocumentChunks } from '@/lib/rag/retriever';
import type { ModuleType } from '@/lib/supabase/types';
import type { AgentToolResult } from './types';

async function searchWithQuery(
  query: string,
  module?: string
): Promise<AgentToolResult> {
  try {
    const embedding = await embedQuery(query);
    const chunks = await searchDocumentChunks(
      embedding,
      (module as ModuleType) ?? 'general'
    );

    if (chunks.length === 0) {
      return { success: false, chunks: [], error: 'No relevant documents found' };
    }

    return {
      success: true,
      chunks: chunks.map((c) => ({
        content: c.content,
        source: c.doc_title,
        similarity: c.similarity,
      })),
    };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Search failed',
    };
  }
}

export async function retrieveDocuments(
  query: string,
  module?: string
): Promise<AgentToolResult> {
  return searchWithQuery(query, module);
}

export async function explainSOP(
  topic: string,
  module?: string
): Promise<AgentToolResult> {
  return searchWithQuery(
    `Standard Operating Procedure steps for: ${topic}`,
    module
  );
}

export async function troubleshootIssue(
  errorDescription: string,
  module?: string
): Promise<AgentToolResult> {
  return searchWithQuery(
    `Error troubleshooting resolution fix: ${errorDescription}`,
    module
  );
}

export async function navigateWorkflow(
  workflowName: string,
  module?: string
): Promise<AgentToolResult> {
  return searchWithQuery(
    `Workflow process approval steps navigation: ${workflowName}`,
    module
  );
}

export async function executeTool(
  name: string,
  args: Record<string, unknown>
): Promise<AgentToolResult> {
  switch (name) {
    case 'retrieve_documents':
      return retrieveDocuments(
        args.query as string,
        args.module as string | undefined
      );
    case 'explain_sop':
      return explainSOP(
        args.topic as string,
        args.module as string | undefined
      );
    case 'troubleshoot_issue':
      return troubleshootIssue(
        args.error_description as string,
        args.module as string | undefined
      );
    case 'navigate_workflow':
      return navigateWorkflow(
        args.workflow_name as string,
        args.module as string | undefined
      );
    default:
      return { success: false, error: `Unknown tool: ${name}` };
  }
}
