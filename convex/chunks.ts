import { v } from 'convex/values';
import { internalMutation, mutation, query } from './_generated/server';

const chunkShape = {
  text: v.string(),
  kind: v.string(),
  conceptLabel: v.optional(v.string()),
  tags: v.array(v.string()),
  isRevision: v.boolean(),
  confidence: v.number(),
};

export const insertChunks = internalMutation({
  args: {
    pageId: v.id('pages'),
    ownerId: v.string(),
    chunks: v.array(v.object(chunkShape)),
  },
  handler: async (ctx, { pageId, ownerId, chunks }) => {
    for (const c of chunks) {
      await ctx.db.insert('chunks', {
        pageId,
        ownerId,
        text: c.text,
        kind: normalizeKind(c.kind),
        conceptLabel: c.conceptLabel ?? 'Untitled',
        tags: c.tags,
        isRevision: c.isRevision,
        confidence: c.confidence,
      });
    }
  },
});

type Kind =
  | 'question'
  | 'derivation'
  | 'definition'
  | 'example'
  | 'diagram'
  | 'general';

function normalizeKind(k: string): Kind {
  const allowed: Kind[] = [
    'question',
    'derivation',
    'definition',
    'example',
    'diagram',
    'general',
  ];
  return allowed.includes(k as Kind) ? (k as Kind) : 'general';
}

export const setEmbedding = mutation({
  args: { chunkId: v.id('chunks'), embedding: v.array(v.number()) },
  handler: async (ctx, { chunkId, embedding }) => {
    await ctx.db.patch(chunkId, { embedding });
  },
});

export const chunksByPage = query({
  args: { pageId: v.id('pages') },
  handler: async (ctx, { pageId }) =>
    ctx.db
      .query('chunks')
      .withIndex('by_page', (q) => q.eq('pageId', pageId))
      .collect(),
});

export const allForOwner = query({
  args: { ownerId: v.string() },
  handler: async (ctx, { ownerId }) =>
    ctx.db
      .query('chunks')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .collect(),
});
