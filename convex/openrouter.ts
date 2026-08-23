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
  /** Reasoning effort for thinking models ('low' keeps responses fast). */
  reasoningEffort?: 'low' | 'medium' | 'high';
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
    reasoning: {
      exclude: true,
      effort: opts.reasoningEffort ?? 'low',
    },
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
      const choice = data.choices?.[0];
      const content: string = choice?.message?.content ?? '';
      // Reasoning models can burn the whole completion budget thinking and
      // return empty or truncated content — treat both as retryable.
      if (!content.trim() || choice?.finish_reason === 'length') {
        lastErr =
          choice?.finish_reason === 'length'
            ? 'model hit the token limit mid-output'
            : 'empty model response';
        continue;
      }
      return content;
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
