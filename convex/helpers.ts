import { v } from 'convex/values';
import { action } from './_generated/server';
import { callOpenRouter } from './openrouter';

export const callJson = action({
  args: { model: v.string(), prompt: v.string() },
  handler: async (_ctx, { model, prompt }) =>
    callOpenRouter(model, [{ role: 'user', content: prompt }], {
      json: true,
      temperature: 0.2,
      maxTokens: 8192,
    }),
});
