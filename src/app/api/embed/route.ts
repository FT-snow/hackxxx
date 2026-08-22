import { type NextRequest, NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/serverAuth';
import { z } from 'zod';

export const runtime = 'nodejs';
export const maxDuration = 60;

let extractorPromise: ReturnType<typeof buildExtractor> | null = null;

function buildExtractor() {
  return import('@xenova/transformers').then(({ pipeline }) =>
    pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2'),
  );
}

function getExtractor() {
  extractorPromise ??= buildExtractor();
  return extractorPromise;
}

const Body = z.object({
  texts: z.array(z.string().min(1)).min(1).max(64),
});

export async function POST(request: NextRequest) {
  const user = await requireUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const parsed = Body.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'texts: string[1..64] required' },
        { status: 400 },
      );
    }
    const extractor = await getExtractor();
    const embeddings = [];
    for (const text of parsed.data.texts) {
      const out = await extractor(text, {
        pooling: 'mean',
        normalize: true,
      });
      embeddings.push(Array.from(out.data as Float32Array));
    }
    return NextResponse.json({ embeddings });
  } catch (err) {
    console.error('embed error:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'embedding failed' },
      { status: 500 },
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}
