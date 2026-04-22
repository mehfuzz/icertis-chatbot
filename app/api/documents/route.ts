import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import type { ModuleType, DocumentType } from '@/lib/supabase/types';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const module = searchParams.get('module') as ModuleType | null;
  const status = searchParams.get('status');

  const supabase = createServerClient();
  let query = supabase
    .from('documents')
    .select('*')
    .order('created_at', { ascending: false });

  if (module) query = query.eq('module', module);
  if (status) query = query.eq('status', status);

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ documents: data });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body?.title || !body?.file_name || !body?.file_type || !body?.module) {
    return NextResponse.json(
      { error: 'title, file_name, file_type, and module are required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();
  const { data, error } = await supabase
    .from('documents')
    .insert({
      title: body.title,
      file_name: body.file_name,
      file_type: body.file_type as DocumentType,
      module: body.module as ModuleType,
      file_url: body.file_url ?? null,
      file_size: body.file_size ?? null,
      metadata: body.metadata ?? {},
      status: 'processing',
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ document: data }, { status: 201 });
}
