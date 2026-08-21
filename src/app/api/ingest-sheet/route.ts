import { type NextRequest, NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';

const OCR_PROMPT = `Transcribe ALL text from this handwritten answer sheet page.
Preserve question numbering and structure. Write math as LaTeX.
Return only the transcribed text, no commentary.`;

async function ocrImage(file: File): Promise<string> {
  const buf = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type};base64,${buf.toString('base64')}`;
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'qwen/qwen3-vl-8b-instruct',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: OCR_PROMPT },
            { type: 'image_url', image_url: { url: dataUri } },
          ],
        },
      ],
      max_tokens: 4096,
      temperature: 0.1,
    }),
  });
  if (!res.ok) throw new Error(`OCR failed (${res.status})`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? '';
}

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }
    const formData = await request.formData();
    const files = formData.getAll('files').filter((f): f is File => f instanceof File);
    if (files.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    const parts: string[] = [];
    for (const file of files) {
      const isPdf =
        file.type === 'application/pdf' ||
        file.name.toLowerCase().endsWith('.pdf');
      if (isPdf) {
        const pdf = await getDocumentProxy(
          new Uint8Array(await file.arrayBuffer()),
        );
        const { text } = await extractText(pdf, { mergePages: true });
        parts.push(text.trim());
      } else if (file.type.startsWith('image/')) {
        parts.push(await ocrImage(file));
      } else if (file.type.startsWith('text/')) {
        parts.push(await file.text());
      }
    }

    const text = parts.filter(Boolean).join('\n\n');
    if (!text.trim()) {
      return NextResponse.json(
        { error: 'Could not read any answers from the upload' },
        { status: 422 },
      );
    }
    return NextResponse.json({ text });
  } catch (error) {
    console.error('Sheet ingest failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to read answer sheet',
      },
      { status: 500 },
    );
  }
}
