import { gemini, CHAT_MODEL } from './client';
import type { Content } from '@google/generative-ai';

export function getChatModel(systemInstruction?: string) {
  return gemini.getGenerativeModel({
    model: CHAT_MODEL,
    systemInstruction: systemInstruction,
    generationConfig: {
      temperature: 0.3,
      topP: 0.95,
      maxOutputTokens: 2048,
    },
  });
}

export async function* streamResponse(
  prompt: string,
  systemInstruction?: string,
  history?: Content[]
): AsyncGenerator<string> {
  const model = getChatModel(systemInstruction);
  const chat = model.startChat({ history: history ?? [] });
  const result = await chat.sendMessageStream(prompt);

  for await (const chunk of result.stream) {
    const text = chunk.text();
    if (text) yield text;
  }
}
