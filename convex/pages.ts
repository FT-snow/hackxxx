import { v } from 'convex/values';
import { mutation, query } from './_generated/server';
import { requireUser } from './helpers';

export const createPage = mutation({
  args: {
    storageId: v.id('_storage'),
    fileName: v.string(),
    mimeType: v.string(),
    sessionId: v.string(),
    subjectId: v.optional(v.id('subjects')),
  },
  handler: async (ctx, args) => {
    const ownerId = await requireUser(ctx);
    return ctx.db.insert('pages', {
      ...args,
      ownerId,
      capturedAt: Date.now(),
      status: 'queued',
    });
  },
});

export const listBySubject = query({
  args: { subjectId: v.id('subjects') },
  handler: async (ctx, { subjectId }) => {
    const userId = await requireUser(ctx);
    const subject = await ctx.db.get(subjectId);
    if (!subject || subject.userId !== userId) return [];
    return ctx.db
      .query('pages')
      .withIndex('by_subject', (q) => q.eq('subjectId', subjectId))
      .order('desc')
      .take(200);
  },
});

export const updateStatus = mutation({
  args: {
    id: v.id('pages'),
    status: v.string(),
    error: v.optional(v.string()),
  },
  handler: async (ctx, { id, status, error }) => {
    const userId = await requireUser(ctx);
    const page = await ctx.db.get(id);
    if (!page || page.ownerId !== userId) throw new Error('Not found');
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
    const userId = await requireUser(ctx);
    const page = await ctx.db.get(id);
    if (!page || page.ownerId !== userId) throw new Error('Not found');
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

export const removePage = mutation({
  args: { id: v.id('pages') },
  handler: async (ctx, { id }) => {
    const userId = await requireUser(ctx);
    const page = await ctx.db.get(id);
    if (!page || page.ownerId !== userId) throw new Error('Page not found');
    const chunks = await ctx.db
      .query('chunks')
      .withIndex('by_page', (q) => q.eq('pageId', id))
      .collect();
    for (const c of chunks) await ctx.db.delete(c._id);
    try {
      await ctx.storage.delete(page.storageId);
    } catch {
      // storage object may already be gone
    }
    await ctx.db.delete(id);
    return { deletedChunks: chunks.length };
  },
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
