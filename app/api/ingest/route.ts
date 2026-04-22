import { type NextRequest } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { embedDocument } from '@/lib/gemini/embeddings';
import type { ModuleType } from '@/lib/supabase/types';

export const maxDuration = 60;

const CHUNK_SIZE = 500;
const CHUNK_OVERLAP = 100;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  const normalized = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  let start = 0;

  while (start < normalized.length) {
    const end = Math.min(start + CHUNK_SIZE, normalized.length);

    // Prefer breaking at a paragraph or sentence boundary near the chunk end
    let breakAt = end;
    if (end < normalized.length) {
      const para = normalized.lastIndexOf('\n\n', end);
      const line = normalized.lastIndexOf('\n', end);
      const sentence = normalized.lastIndexOf('. ', end);
      const midpoint = start + CHUNK_SIZE / 2;

      if (para > midpoint) breakAt = para;
      else if (line > midpoint) breakAt = line;
      else if (sentence > midpoint) breakAt = sentence + 1;
    }

    const chunk = normalized.slice(start, breakAt).trim();
    if (chunk.length > 20) chunks.push(chunk);

    start = breakAt - CHUNK_OVERLAP;
    if (start <= 0 && breakAt >= normalized.length) break;
    if (start < 0) start = 0;
    if (start >= normalized.length) break;
  }

  return chunks;
}

async function extractText(file: File): Promise<string> {
  if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require('pdf-parse');
    const buffer = Buffer.from(await file.arrayBuffer());
    const data = await pdfParse(buffer);
    return data.text as string;
  }
  return file.text();
}

export async function POST(request: NextRequest) {
  const enc = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(data)}\n\n`));

      try {
        let formData: FormData;
        try {
          formData = await request.formData();
        } catch {
          send({ type: 'error', error: 'Invalid form data' });
          controller.close();
          return;
        }

        const file = formData.get('file') as File | null;
        const title = (formData.get('title') as string | null)?.trim();
        const module = formData.get('module') as ModuleType | null;

        if (!file || !title || !module) {
          send({ type: 'error', error: 'file, title, and module are required' });
          controller.close();
          return;
        }

        send({ type: 'progress', step: 'Reading file…', percent: 5 });

        let text: string;
        try {
          text = await extractText(file);
        } catch (e) {
          send({ type: 'error', error: `Text extraction failed: ${e instanceof Error ? e.message : String(e)}` });
          controller.close();
          return;
        }

        if (!text.trim()) {
          send({ type: 'error', error: 'File appears to be empty or unreadable' });
          controller.close();
          return;
        }

        send({ type: 'progress', step: 'Chunking document…', percent: 15 });
        const chunks = chunkText(text);

        if (chunks.length === 0) {
          send({ type: 'error', error: 'No text chunks produced' });
          controller.close();
          return;
        }

        const supabase = createServerClient();
        const fileType = file.type === 'application/pdf' || file.name.endsWith('.pdf') ? 'pdf' : 'text';

        const { data: doc, error: docErr } = await supabase
          .from('documents')
          .insert({
            title,
            file_name: file.name,
            file_type: fileType,
            module,
            file_size: file.size,
            status: 'processing',
            metadata: { source: 'admin_upload' },
          })
          .select()
          .single();

        if (docErr || !doc) {
          send({ type: 'error', error: docErr?.message ?? 'Failed to create document record' });
          controller.close();
          return;
        }

        send({ type: 'progress', step: `Embedding ${chunks.length} chunks…`, percent: 25 });

        try {
          const embeddings: number[][] = [];
          for (let i = 0; i < chunks.length; i++) {
            embeddings.push(await embedDocument(chunks[i]));
            // Rate-limit: Gemini free tier ~15 RPM
            if (i < chunks.length - 1) await new Promise((r) => setTimeout(r, 200));
            if (i % 5 === 4 || i === chunks.length - 1) {
              const pct = 25 + Math.round(((i + 1) / chunks.length) * 55);
              send({ type: 'progress', step: `Embedded ${i + 1}/${chunks.length} chunks`, percent: pct });
            }
          }

          send({ type: 'progress', step: 'Saving to database…', percent: 85 });

          const rows = chunks.map((content, i) => ({
            document_id: doc.id,
            content,
            chunk_index: i,
            embedding: embeddings[i],
            module,
            metadata: { source_file: file.name, module, doc_type: fileType },
            token_count: content.split(/\s+/).length,
          }));

          const BATCH = 50;
          for (let i = 0; i < rows.length; i += BATCH) {
            const { error } = await supabase.from('document_chunks').insert(rows.slice(i, i + BATCH));
            if (error) throw new Error(error.message);
          }

          await supabase
            .from('documents')
            .update({ status: 'ready', chunk_count: chunks.length })
            .eq('id', doc.id);

          send({ type: 'done', document_id: doc.id, chunk_count: chunks.length });
        } catch (err) {
          await supabase
            .from('documents')
            .update({ status: 'failed', metadata: { error: String(err) } })
            .eq('id', doc.id);
          send({ type: 'error', error: err instanceof Error ? err.message : String(err) });
        }
      } catch (err) {
        try {
          const enc2 = new TextEncoder();
          controller.enqueue(
            enc2.encode(`data: ${JSON.stringify({ type: 'error', error: String(err) })}\n\n`)
          );
        } catch { /* controller already closed */ }
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'X-Accel-Buffering': 'no',
    },
  });
}
