import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

export const gemini = new GoogleGenerativeAI(apiKey);

export const CHAT_MODEL = 'gemini-1.5-flash';
// text-embedding-004 is v1-only; embedding-001 works on v1beta (same 768-dim output)
export const EMBEDDING_MODEL = 'embedding-001';
