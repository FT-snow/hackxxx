import { defineSchema, defineTable } from 'convex/server';
import { v } from 'convex/values';
import { authTables } from '@convex-dev/auth/server';

export default defineSchema({
  ...authTables,

  subjects: defineTable({
    userId: v.string(),
    name: v.string(),
    createdAt: v.number(),
  }).index('by_user', ['userId']),

  pages: defineTable({
    ownerId: v.string(),
    subjectId: v.optional(v.id('subjects')),
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
    .index('by_session', ['sessionId'])
    .index('by_subject', ['subjectId']),

  chunks: defineTable({
    pageId: v.id('pages'),
    ownerId: v.string(),
    subjectId: v.optional(v.id('subjects')),
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
    .index('by_owner', ['ownerId'])
    .index('by_subject', ['subjectId']),

  quizAttempts: defineTable({
    userId: v.string(),
    subjectId: v.optional(v.id('subjects')),
    mode: v.string(),
    totalQuestions: v.number(),
    score: v.number(),
    totalMarks: v.number(),
    percentage: v.number(),
    takenAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_subject', ['subjectId']),

  studyDays: defineTable({
    userId: v.string(),
    day: v.string(),
    count: v.number(),
  }).index('by_user_day', ['userId', 'day']),

  concepts: defineTable({
    ownerId: v.string(),
    subjectId: v.optional(v.id('subjects')),
    label: v.string(),
    chunkIds: v.array(v.id('chunks')),
    pageCount: v.number(),
    summary: v.optional(v.string()),
    lastActiveAt: v.number(),
  })
    .index('by_owner', ['ownerId'])
    .index('by_subject', ['subjectId']),
});
