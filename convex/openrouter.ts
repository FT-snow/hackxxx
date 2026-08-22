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

const MODEL_FALLBACKS: Record<string, string[]> = {
  'google/gemma-4-31b-it:free': [
    'nvidia/nemotron-nano-12b-v2-vl:free',
    'openai/gpt-oss-20b',
  ],
};

export async function callOpenRouter(
  model: string,
  messages: ORMessage[],
  opts: OROpts = {},
): Promise<string> {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY not set');

  const body: Record<string, unknown> = {
    messages,
    max_tokens: opts.maxTokens ?? 4096,
    temperature: opts.temperature ?? 0.3,
  };
  if (opts.json) body.response_format = { type: 'json_object' };

  const chain = [model, ...(MODEL_FALLBACKS[model] ?? [])];
  let lastErr = '';

  for (const m of chain) {
    for (let attempt = 0; attempt < 2; attempt++) {
      if (attempt > 0) await new Promise((r) => setTimeout(r, 4000));
      try {
        const res = await fetch(OPENROUTER_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ ...body, model: m }),
        });
        if (!res.ok) {
          lastErr = `OpenRouter ${res.status} (${m}): ${(await res.text()).slice(0, 200)}`;
          if (res.status === 429 || res.status >= 500) continue;
          break;
        }
        const data = await res.json();
        return data.choices?.[0]?.message?.content ?? '';
      } catch {
        lastErr = `network error (${m})`;
      }
    }
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
