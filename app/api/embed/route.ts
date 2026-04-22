import { type NextRequest, NextResponse } from 'next/server';
import { embedQuery, embedDocument } from '@/lib/gemini/embeddings';

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.text) {
    return NextResponse.json({ error: 'text is required' }, { status: 400 });
  }

  const taskType = body.taskType ?? 'query';

  const embedding =
    taskType === 'document'
      ? await embedDocument(body.text)
      : await embedQuery(body.text);

  return NextResponse.json({ embedding, dimensions: embedding.length });
}
