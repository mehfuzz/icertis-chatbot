import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Diagnostic endpoint: shows which Gemini models are available for the configured API key.
// Visit /api/models to debug embedding model availability.
export async function GET() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return NextResponse.json({ error: 'GEMINI_API_KEY not set' }, { status: 500 });

  const BASE = 'https://generativelanguage.googleapis.com';
  const output: Record<string, unknown> = {};

  for (const ver of ['v1beta', 'v1']) {
    const res = await fetch(`${BASE}/${ver}/models?key=${apiKey}`);
    if (!res.ok) {
      output[ver] = { httpStatus: res.status };
      continue;
    }
    const { models = [] } = await res.json();
    output[ver] = (models as Array<{ name: string; supportedGenerationMethods?: string[] }>).map((m) => ({
      name: m.name,
      methods: m.supportedGenerationMethods ?? [],
    }));
  }

  const embedModels = Object.entries(output).flatMap(([ver, models]) =>
    Array.isArray(models)
      ? models
          .filter((m: { methods: string[] }) => m.methods.includes('embedContent'))
          .map((m: { name: string }) => `${ver}/${m.name}`)
      : []
  );

  return NextResponse.json({ embedModels, all: output });
}
