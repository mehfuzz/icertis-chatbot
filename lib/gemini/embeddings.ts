// The @google/generative-ai SDK v0.15.0 hardcodes v1beta; embedding models may only be on v1.
// We call the REST API directly and auto-discover the right model via ListModels.

const BASE = 'https://generativelanguage.googleapis.com';

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return key;
}

// Cached per serverless function instance (reset on cold start)
let cachedEmbedUrl: string | null = null;

async function resolveEmbedUrl(): Promise<string> {
  if (cachedEmbedUrl) return cachedEmbedUrl;

  // Manual override: set GEMINI_EMBEDDING_MODEL=text-embedding-004 in Vercel env vars
  const override = process.env.GEMINI_EMBEDDING_MODEL;
  if (override) {
    const modelPath = override.startsWith('models/') ? override : `models/${override}`;
    cachedEmbedUrl = `${BASE}/v1beta/${modelPath}:embedContent`;
    return cachedEmbedUrl;
  }

  // Auto-discover: try v1beta first (same version as chat model), then v1
  const key = apiKey();
  for (const ver of ['v1beta', 'v1']) {
    const res = await fetch(`${BASE}/${ver}/models?key=${key}`);
    if (!res.ok) continue;
    const { models = [] } = await res.json();
    const found = (models as Array<{ name: string; supportedGenerationMethods?: string[] }>)
      .find((m) => m.supportedGenerationMethods?.includes('embedContent'));
    if (found) {
      console.log(`[embeddings] using ${found.name} via ${ver}`);
      cachedEmbedUrl = `${BASE}/${ver}/${found.name}:embedContent`;
      return cachedEmbedUrl;
    }
  }

  throw new Error(
    'No embedding model found for this API key. ' +
    'Set GEMINI_EMBEDDING_MODEL env var (e.g. text-embedding-004) or visit /api/models to see available models.'
  );
}

async function callEmbed(text: string, taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT'): Promise<number[]> {
  const url = await resolveEmbedUrl();
  const res = await fetch(`${url}?key=${apiKey()}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      content: { parts: [{ text }] },
      taskType,
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    cachedEmbedUrl = null; // bust cache so next request re-discovers
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
