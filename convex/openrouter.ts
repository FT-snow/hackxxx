const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';

export type ORPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface ORMessage {
  role: 'system' | 'user' | 'assistant';
  content: string | ORPart[];
}

export interface OROpts {
  maxTokens?: number;
  temperature?: number;
  json?: boolean;
}

export async function callOpenRouter(
  model: string,
  messages: ORMessage[],
  opts: OROpts = {},
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not set');

  const body: Record<string, unknown> = {
    model,
    messages,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.3,
  };
  if (opts.json) body.response_format = { type: 'json_object' };

  let lastErr = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, attempt * 2000));
    let res: Response;
    try {
      res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
    } catch {
      lastErr = 'network error';
      continue;
    }
    if (!res.ok) {
      lastErr = `OpenRouter ${res.status}: ${await res.text()}`;
      if (res.status === 429 || res.status >= 500) continue;
      throw new Error(lastErr);
    }
    const data = await res.json();
    return data.choices?.[0]?.message?.content ?? '';
  }
  throw new Error(lastErr || 'OpenRouter request failed');
}

export async function callVision(
  model: string,
  textPrompt: string,
  imageDataUri: string,
  opts: OROpts = {},
): Promise<string> {
  return callOpenRouter(
    model,
    [
      {
        role: 'user',
        content: [
          { type: 'text', text: textPrompt },
          { type: 'image_url', image_url: { url: imageDataUri } },
        ],
      },
    ],
    opts,
  );
}
