// text-embedding-004 is only on the v1 API; @google/generative-ai v0.15.0 is hardcoded
// to v1beta, so we call the REST endpoint directly instead of using the SDK.
const EMBED_MODEL = 'text-embedding-004';
const EMBED_URL = `https://generativelanguage.googleapis.com/v1/models/${EMBED_MODEL}:embedContent`;

async function callEmbedAPI(text: string, taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT'): Promise<number[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not set');

  const resp = await fetch(`${EMBED_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: `models/${EMBED_MODEL}`,
      content: { parts: [{ text }] },
      taskType,
    }),
  });

  if (!resp.ok) {
    const body = await resp.text();
    throw new Error(`Gemini embed ${resp.status}: ${body}`);
  }

  const data = await resp.json();
  return data.embedding.values as number[];
}

export async function embedQuery(text: string): Promise<number[]> {
  return callEmbedAPI(text, 'RETRIEVAL_QUERY');
}

export async function embedDocument(text: string): Promise<number[]> {
  return callEmbedAPI(text, 'RETRIEVAL_DOCUMENT');
}

// Batch embed with delay to respect Gemini free tier rate limits (15 RPM)
export async function embedBatch(
  texts: string[],
  taskType: 'RETRIEVAL_QUERY' | 'RETRIEVAL_DOCUMENT' = 'RETRIEVAL_DOCUMENT',
  delayMs = 200
): Promise<number[][]> {
  const results: number[][] = [];
  for (const text of texts) {
    results.push(await callEmbedAPI(text, taskType));
    if (delayMs > 0) {
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  return results;
}
