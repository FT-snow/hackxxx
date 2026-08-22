import { v } from 'convex/values';
import { action } from './_generated/server';
import type { ActionCtx, MutationCtx, QueryCtx } from './_generated/server';
import { callOpenRouter } from './openrouter';

type Ctx = QueryCtx | MutationCtx | ActionCtx;

export async function requireUser(ctx: Ctx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error('UNAUTHENTICATED');
  return identity.subject;
}

export const callJson = action({
  args: { model: v.string(), prompt: v.string() },
  handler: async (_ctx, { model, prompt }) =>
    callOpenRouter(model, [{ role: 'user', content: prompt }], {
      json: true,
      temperature: 0.2,
      maxTokens: 8192,
    }),
});
