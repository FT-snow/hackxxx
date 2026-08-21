import { type NextRequest, NextResponse } from 'next/server';

const FREEIMAGE_API_KEY = '6d207e02198a847aa98d0a2a901485a5';
const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;

async function uploadImage(file: File): Promise<string | null> {
  try {
    const formData = new FormData();
    formData.append('source', file);
    formData.append('key', FREEIMAGE_API_KEY);
    formData.append('format', 'json');

    const response = await fetch('https://freeimage.host/api/1/upload', {
      method: 'POST',
      body: formData,
    });

    if (response.ok) {
      const result = await response.json();
      if (result.status_code === 200) {
        return result.image.url;
      }
    }
    return null;
  } catch (error) {
    console.error('Error uploading image:', error);
    return null;
  }
}

async function detectTextWithQwen(imageUrl: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error('OpenRouter API key not configured');
  }

  const messages = [
    {
      role: 'user',
      content: [
        {
          type: 'text',
          text: 'Extract all text from this image. Return only the text content without any descriptions or commentary. If there is handwriting, convert it to typed text maintaining the original structure and formatting.',
        },
        {
          type: 'image_url',
          image_url: {
            url: imageUrl,
          },
        },
      ],
    },
  ];

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
          model: 'qwen/qwen-2-vl-7b-instruct',
          messages,
          max_tokens: 4096,
          temperature: 0.1,
          top_p: 0.9,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      },
    );

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`);
    }

    const result = await response.json();
    return result.choices[0]?.message?.content || 'No text detected';
  } catch (error) {
    console.error('Error processing image with Qwen:', error);
    throw error;
  }
}

async function processImageFile(file: File): Promise<string> {
  const imageUrl = await uploadImage(file);

  if (!imageUrl) {
    throw new Error('Failed to upload image');
  }

  return await detectTextWithQwen(imageUrl);
}

async function processPdfFile(file: File): Promise<string> {
  try {
    const _buffer = await file.arrayBuffer();
    return 'PDF processing: Please convert PDF pages to images for better text extraction with handwriting recognition. Alternatively, if this is a text-based PDF, please copy and paste the content directly.';
  } catch (error) {
    console.error('Error processing PDF:', error);
    return 'Error processing PDF file. Please convert to images for handwriting recognition.';
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    let extractedText: string;

    if (file.type === 'application/pdf') {
      extractedText = await processPdfFile(file);
    } else if (file.type.startsWith('image/')) {
      extractedText = await processImageFile(file);
    } else {
      return NextResponse.json(
        {
          error:
            'Unsupported file type. Please upload images (PNG, JPG) or PDFs.',
        },
        { status: 400 },
      );
    }

    return NextResponse.json({ text: extractedText });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
