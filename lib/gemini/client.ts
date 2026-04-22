import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

export const gemini = new GoogleGenerativeAI(apiKey);

// streaming.ts and embeddings.ts call the v1 REST API directly (bypasses SDK's v1beta hardcode)
export const CHAT_MODEL = 'gemini-2.5-flash';
export const EMBEDDING_MODEL = 'gemini-embedding-001';
