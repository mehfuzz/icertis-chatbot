import { type NextRequest } from 'next/server';
import { runRAGPipeline } from '@/lib/rag/pipeline';
import type { ModuleType } from '@/lib/supabase/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const missingVars = [
    'GEMINI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'SUPABASE_SERVICE_ROLE_KEY',
  ].filter((v) => !process.env[v]);

  if (missingVars.length > 0) {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', error: `Missing environment variables: ${missingVars.join(', ')}. Set these in your Vercel project settings.` })}\n\n`,
      { status: 200, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  let body: { message?: string; sessionId?: string; module?: string };

  try {
    body = await request.json();
  } catch {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', error: 'Invalid request body' })}\n\n`,
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  const { message, sessionId, module = 'general' } = body;

  if (!message?.trim()) {
    return new Response(
      `data: ${JSON.stringify({ type: 'error', error: 'Message is required' })}\n\n`,
      { status: 400, headers: { 'Content-Type': 'text/event-stream' } }
    );
  }

  const validModules: ModuleType[] = ['icm', 'oracle', 'general'];
  const selectedModule: ModuleType = validModules.includes(module as ModuleType)
    ? (module as ModuleType)
    : 'general';

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function send(data: object) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        for await (const chunk of runRAGPipeline(
          message.trim(),
          selectedModule,
          sessionId
        )) {
          send(chunk);
        }
      } catch (err) {
        console.error('Chat route error:', err);
        send({ type: 'error', error: 'An unexpected error occurred' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
}
