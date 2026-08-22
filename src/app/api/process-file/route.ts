import { type NextRequest, NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/serverAuth';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

const OCR_PROMPT = `Extract ALL text from this image exactly as written.
Rules:
- This may be a question paper, answer key, or handwritten student answers.
- Preserve structure: headings, numbered questions, line breaks.
- Write math as plain text (e.g. x^2 + 2x = 5).
- If a word is illegible write [?].
Return only the extracted text, no commentary.`;

async function detectText(file: File): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }
  const buffer = Buffer.from(await file.arrayBuffer());
  const dataUri = `data:${file.type || 'image/png'};base64,${buffer.toString('base64')}`;

  let lastErr = 'vision failed';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 4000));
    try {
      const response = await fetch(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'qwen/qwen3-vl-8b-instruct',
            max_tokens: 4096,
            temperature: 0.1,
            messages: [
              {
                role: 'user',
                content: [
                  { type: 'text', text: OCR_PROMPT },
                  { type: 'image_url', image_url: { url: dataUri } },
                ],
              },
            ],
          }),
        },
      );
      if (!response.ok) {
        lastErr = `OCR service error (${response.status})`;
        if (response.status === 429 || response.status >= 500) continue;
        break;
      }
      const result = await response.json();
      const text = result.choices?.[0]?.message?.content;
      if (!text) {
        lastErr = 'No text could be read from this image — try a sharper photo';
        continue;
      }
      return text.trim();
    } catch {
      lastErr = 'network error contacting OCR service';
    }
  }
  throw new Error(lastErr);
}

export async function POST(request: NextRequest) {
  const user = await requireUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let extractedText: string;

    if (file.type.startsWith('image/')) {
      extractedText = await detectText(file);
    } else if (
      file.type === 'application/pdf' ||
      file.type === 'text/plain' ||
      /\.(txt|md)$/i.test(file.name)
    ) {
      const raw = await file.text();
      extractedText = raw.slice(0, 20000);
      if (!extractedText.trim()) {
        throw new Error('This PDF has no extractable text — upload page photos instead');
      }
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload images (PNG, JPG, WEBP), text files, or paste the content directly.' },
        { status: 400 },
      );
    }

    return NextResponse.json({ text: extractedText });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Could not read this file — try a clearer photo',
      },
      { status: 500 },
    );
  }
}
