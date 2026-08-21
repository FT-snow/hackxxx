import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { DEMO_USER_ID } from './consts';

export const createPage = mutation({
  args: {
    storageId: v.id('_storage'),
    fileName: v.string(),
    mimeType: v.string(),
    sessionId: v.string(),
  },
  handler: async (ctx, args) =>
    ctx.db.insert('pages', {
      ...args,
      ownerId: DEMO_USER_ID,
      capturedAt: Date.now(),
      status: 'queued',
    }),
});

export const updateStatus = mutation({
  args: { id: v.id('pages'), status: v.string(), error: v.optional(v.string()) },
  handler: async (ctx, { id, status, error }) => {
    const patch: Record<string, unknown> = { status };
    if (error !== undefined) patch.error = error;
    await ctx.db.patch(id, patch);
  },
});

export const setOcr = mutation({
  args: {
    id: v.id('pages'),
    ocrText: v.string(),
    ocrConfidence: v.optional(v.number()),
  },
  handler: async (ctx, { id, ocrText, ocrConfidence }) => {
    await ctx.db.patch(id, {
      ocrText,
      ocrConfidence,
      status: 'embedding',
    });
  },
});

export const get = query({
  args: { id: v.id('pages') },
  handler: async (ctx, { id }) => ctx.db.get(id),
});

export const listBySession = query({
  args: { sessionId: v.string() },
  handler: async (ctx, { sessionId }) =>
    ctx.db
      .query('pages')
      .withIndex('by_session', (q) => q.eq('sessionId', sessionId))
      .order('desc')
      .collect(),
});

export const listAll = query({
  args: {},
  handler: async (ctx) =>
    ctx.db.query('pages').withIndex('by_owner').order('desc').take(100),
});
