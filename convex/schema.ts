import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';

export default defineSchema({
  pages: defineTable({
    ownerId: v.string(),
    storageId: v.id('_storage'),
    fileName: v.string(),
    mimeType: v.string(),
    sessionId: v.string(),
    capturedAt: v.number(),
    status: v.union(
      v.literal('queued'),
      v.literal('ocr'),
      v.literal('embedding'),
      v.literal('tagged'),
      v.literal('done'),
      v.literal('error'),
    ),
    ocrText: v.optional(v.string()),
    ocrConfidence: v.optional(v.number()),
    error: v.optional(v.string()),
  })
    .index('by_owner', ['ownerId'])
    .index('by_session', ['sessionId']),

  chunks: defineTable({
    pageId: v.id('pages'),
    ownerId: v.string(),
    text: v.string(),
    kind: v.union(
      v.literal('question'),
      v.literal('derivation'),
      v.literal('definition'),
      v.literal('example'),
      v.literal('diagram'),
      v.literal('general'),
    ),
    conceptLabel: v.optional(v.string()),
    tags: v.array(v.string()),
    isRevision: v.optional(v.boolean()),
    confidence: v.optional(v.number()),
    embedding: v.optional(v.array(v.number())),
  })
    .vectorIndex('by_embedding', {
      vectorField: 'embedding',
      dimensions: 384,
      filterFields: ['ownerId'],
    })
    .index('by_page', ['pageId'])
    .index('by_owner', ['ownerId']),

  concepts: defineTable({
    ownerId: v.string(),
    label: v.string(),
    chunkIds: v.array(v.id('chunks')),
    pageCount: v.number(),
    summary: v.optional(v.string()),
    lastActiveAt: v.number(),
  }).index('by_owner', ['ownerId']),
});
