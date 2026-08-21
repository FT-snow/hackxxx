import { type NextRequest, NextResponse } from 'next/server';
import { extractText, getDocumentProxy } from 'unpdf';

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get('content-type') ?? '';
    if (!contentType.includes('multipart/form-data')) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 },
      );
    }
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    if (
      file.type !== 'application/pdf' &&
      !file.name.toLowerCase().endsWith('.pdf')
    ) {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 },
      );
    }

    const buffer = await file.arrayBuffer();
    const pdf = await getDocumentProxy(new Uint8Array(buffer));
    const { text } = await extractText(pdf, { mergePages: true });
    const merged = text.trim();

    if (!merged || merged === '\n') {
      return NextResponse.json(
        {
          error:
            'No extractable text (scanned PDF). Export pages as images and upload those instead.',
        },
        { status: 422 },
      );
    }

    return NextResponse.json({ text: merged, pages: pdf.numPages });
  } catch (error) {
    console.error('PDF extraction failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to extract PDF text',
      },
      { status: 500 },
    );
  }
}
