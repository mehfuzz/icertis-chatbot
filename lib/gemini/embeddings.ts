// @google/generative-ai v0.15.0 hardcodes v1beta; gemini-embedding-001 is on v1beta.
// We call REST directly to control outputDimensionality (default is 3072 but schema is vector(768)).

const BASE = 'https://generativelanguage.googleapis.com/v1beta';
// Set GEMINI_EMBEDDING_MODEL env var to override (e.g. gemini-embedding-2-preview)
const DEFAULT_EMBED_MODEL = 'gemini-embedding-001';

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return key;
}

function embedUrl(): string {
  const model = process.env.GEMINI_EMBEDDING_MODEL ?? DEFAULT_EMBED_MODEL;
  const modelPath = model.startsWith('models/') ? model : `models/${model}`;
  return `${BASE}/${modelPath}:embedContent`;
}

async function callEmbed(text: string, taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT'): Promise<number[]> {
  const res = await fetch(`${embedUrl()}?key=${apiKey()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: 768,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Gemini embed ${res.status}: ${body}`);
  }

  const data = await res.json();
  return data.embedding.values as number[];
}

export async function embedQuery(text: string): Promise<number[]> {
  return callEmbed(text, 'RETRIEVAL_QUERY');
}

export async function embedDocument(text: string): Promise<number[]> {
  return callEmbed(text, 'RETRIEVAL_DOCUMENT');
}

export async function embedBatch(
  texts: string[],
  taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_DOCUMENT',
  delayMs = 200
): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await callEmbed(text, taskType));
    if (delayMs > 0) await new Promise((r) => setTimeout(r, delayMs));
  }
  return results;
}
