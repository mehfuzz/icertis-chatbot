// Bypass @google/generative-ai SDK (hardcodes v1beta) — call v1 REST directly.
// v1 and v1beta are tracked under separate quota pools; free-tier quota on v1beta
// may be 0 even when v1 has available quota.

const BASE = 'https://generativelanguage.googleapis.com/v1';
// Set GEMINI_CHAT_MODEL in Vercel env vars to override without redeployment
const DEFAULT_CHAT_MODEL = 'gemini-2.5-flash';

export { DEFAULT_CHAT_MODEL as CHAT_MODEL };

function chatModel() {
  return process.env.GEMINI_CHAT_MODEL ?? DEFAULT_CHAT_MODEL;
}

function apiKey() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error('GEMINI_API_KEY is not set');
  return key;
}

interface GeminiContent {
  role: string;
  parts: { text: string }[];
}

export async function* streamResponse(
  prompt: string,
  systemInstruction?: string,
  history?: GeminiContent[]
): AsyncGenerator<string> {
  const model = chatModel();
  const url = `${BASE}/models/${model}:streamGenerateContent?alt=sse&key=${apiKey()}`;

  const body: Record<string, unknown> = {
    contents: [...(history ?? []), { role: 'user', parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.3, topP: 0.95, maxOutputTokens: 2048 },
  };
  if (systemInstruction) {
    body.systemInstruction = { parts: [{ text: systemInstruction }] };
  }

  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!resp.ok || !resp.body) {
    const errText = await resp.text();
    throw new Error(`[GoogleGenerativeAI Error]: Error fetching from ${url}: [${resp.status}] ${errText}`);
  }

  // Parse SSE: each line is "data: <json>" or blank
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() ?? '';
    for (const line of lines) {
      if (!line.startsWith('data: ')) continue;
      const json = line.slice(6).trim();
      if (!json || json === '[DONE]') continue;
      try {
        const chunk = JSON.parse(json);
        const text: string | undefined = chunk?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (text) yield text;
      } catch {
        // skip malformed chunk
      }
    }
  }
}
