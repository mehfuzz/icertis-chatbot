import { TaskType } from '@google/generative-ai';
import { gemini, EMBEDDING_MODEL } from './client';

const embeddingModel = gemini.getGenerativeModel({ model: EMBEDDING_MODEL });

// Use RETRIEVAL_QUERY for user queries at search time
export async function embedQuery(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }], role: 'user' },
    taskType: TaskType.RETRIEVAL_QUERY,
  });
  return result.embedding.values;
}

// Use RETRIEVAL_DOCUMENT for chunks being stored (called from API only, not ingestion scripts)
export async function embedDocument(text: string): Promise<number[]> {
  const result = await embeddingModel.embedContent({
    content: { parts: [{ text }], role: 'user' },
    taskType: TaskType.RETRIEVAL_DOCUMENT,
  });
  return result.embedding.values;
}

// Batch embed with delay to respect Gemini free tier rate limits (15 RPM)
export async function embedBatch(
  texts: string[],
  taskType: TaskType = TaskType.RETRIEVAL_DOCUMENT,
  delayMs = 200
): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    const result = await embeddingModel.embedContent({
      content: { parts: [{ text }], role: 'user' },
      taskType,
    });
    results.push(result.embedding.values);
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}
