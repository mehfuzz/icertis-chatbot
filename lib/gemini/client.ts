import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is not set');
}

export const gemini = new GoogleGenerativeAI(apiKey);

// gemini-2.0-flash has limit:0 on free tier for this key; flash-lite has higher free-tier quotas
export const CHAT_MODEL = 'gemini-2.0-flash-lite';
export const EMBEDDING_MODEL = 'gemini-embedding-001';
