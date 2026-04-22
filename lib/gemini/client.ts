import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

export const gemini = new GoogleGenerativeAI(apiKey);

export const CHAT_MODEL = 'gemini-1.5-flash';
export const EMBEDDING_MODEL = 'text-embedding-004';
