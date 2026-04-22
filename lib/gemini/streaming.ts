import { gemini, CHAT_MODEL } from './client';
import type { Content } from '@google/generative-ai';

// Allow model override without redeployment: set GEMINI_CHAT_MODEL env var
function resolvedChatModel() {
  return process.env.GEMINI_CHAT_MODEL ?? CHAT_MODEL;
}

export function getChatModel(systemInstruction?: string) {
  return gemini.getGenerativeModel({
    model: resolvedChatModel(),
    systemInstruction,
    generationConfig: {
      temperature: 0.3,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });
}

// Retry up to maxAttempts on 429 with exponential backoff
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let delay = 5000;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      const is429 = err instanceof Error && err.message.includes('429');
      const limitZero = err instanceof Error && err.message.includes('limit: 0');
      if (limitZero) throw err; // quota is 0 — retrying won't help
      if (!is429 || attempt === maxAttempts) throw err;
      await new Promise((r) => setTimeout(r, delay));
      delay *= 2;
    }
  }
  throw new Error('unreachable');
}

export async function* streamResponse(
  prompt: string,
  systemInstruction?: string,
  history?: Content[]
): AsyncGenerator<string> {
  const model = getChatModel(systemInstruction);
  const chat = model.startChat({ history: history ?? [] });
  const result = await withRetry(() => chat.sendMessageStream(prompt));

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}
