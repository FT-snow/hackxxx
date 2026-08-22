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
    // gpt-oss and other reasoning models leak their analysis channel into
    // content unless the reasoning output is explicitly excluded.
    reasoning: { exclude: true },
  };
  if (opts.json) body.response_format = { type: 'json_object' };

  let lastErr = '';
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 4000));
    try {
      const res = await fetch(OPENROUTER_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        lastErr = `OpenRouter ${res.status}: ${(await res.text()).slice(0, 300)}`;
        if (res.status === 429 || res.status >= 500) continue;
        break;
      }
      const data = await res.json();
      return data.choices?.[0]?.message?.content ?? '';
    } catch {
      lastErr = 'network error';
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

/**
 * Tolerant JSON extraction: models occasionally wrap payloads in markdown
 * fences or prepend stray text despite response_format=json_object.
 */
export function parseJsonLoose(raw: string): unknown {
  const trimmed = raw.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.search(/[{[]/);
    if (start === -1) throw new Error('Model returned non-JSON output');
    const opener = trimmed[start];
    const closer = opener === '{' ? '}' : ']';
    const end = trimmed.lastIndexOf(closer);
    if (end <= start) throw new Error('Model returned truncated JSON');
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}
