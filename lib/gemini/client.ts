import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

export const gemini = new GoogleGenerativeAI(apiKey);

export const CHAT_MODEL = 'gemini-2.0-flash';
// embeddings.ts calls the v1beta REST API directly (SDK hardcodes v1beta; text-embedding-* not available there)
export const EMBEDDING_MODEL = 'gemini-embedding-001';
