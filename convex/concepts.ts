import { v } from 'convex/values';
import { action, internalMutation, query } from './_generated/server';
import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { requireUser } from './helpers';

const PALETTE = [
  '#E9C468',
  '#8CB0C4',
  '#D4A574',
  '#C48CB0',
  '#B0C48C',
  '#8C84C4',
];

interface ChunkDoc {
  _id: string;
  pageId: string;
  text: string;
  kind: string;
  conceptLabel: string | undefined;
  embedding: number[] | undefined;
}

interface Cluster {
  label: string;
  chunkIds: Array<Id<'chunks'>>;
  pageCount: number;
  lastActiveAt: number;
}

export const rebuildConcepts = action({
  args: { subjectId: v.optional(v.id('subjects')) },
  handler: async (ctx, { subjectId }) => {
    const ownerId = await requireUser(ctx);
    const chunks = subjectId
      ? ((await ctx.runQuery(api.chunks.allForSubject, {
          subjectId,
        })) as ChunkDoc[])
      : ((await ctx.runQuery(
          api.chunks.allForOwner,
          {},
        )) as ChunkDoc[]);
    const embedded = chunks.filter((c) => c.embedding);

    const parent = new Map<string, string>();
    const find = (x: string): string => {
      let r = x;
      while (parent.get(r) !== r) r = parent.get(r) ?? r;
      return r;
    };
    const union = (a: string, b: string) => {
      parent.set(find(a), find(b));
    };
    for (const c of embedded) parent.set(c._id, c._id);

    const byLabel = new Map<string, string[]>();
    for (const c of embedded) {
      const norm = (c.conceptLabel ?? 'untitled').toLowerCase().trim();
      const group = byLabel.get(norm) ?? [];
      group.push(c._id);
      byLabel.set(norm, group);
    }
    for (const ids of byLabel.values()) {
      for (let i = 1; i < ids.length; i++) union(ids[0], ids[i]);
    }

    for (const chunk of embedded) {
      if (!chunk.embedding) continue;
      const hits = await ctx.vectorSearch('chunks', 'by_embedding', {
        vector: chunk.embedding,
        limit: 6,
        filter: (q) => q.eq('ownerId', ownerId),
      });
      for (const hit of hits) {
        if (hit._id !== chunk._id && hit._score >= 0.55) {
          union(chunk._id, hit._id);
        }
      }
    }

    const groups = new Map<string, typeof embedded>();
    for (const c of embedded) {
      const root = find(c._id);
      const g = groups.get(root) ?? [];
      g.push(c);
      groups.set(root, g);
    }

    const clusters: Cluster[] = [];
    for (const g of groups.values()) {
      const counts = new Map<string, number>();
      for (const c of g) {
        const l = c.conceptLabel ?? 'Untitled';
        counts.set(l, (counts.get(l) ?? 0) + 1);
      }
      const label =
        [...counts.entries()].sort((x, y) => y[1] - x[1])[0]?.[0] ?? 'Untitled';
      clusters.push({
        label,
        chunkIds: g.map((c) => c._id as Id<'chunks'>),
        pageCount: new Set(g.map((c) => c.pageId)).size,
        lastActiveAt: Date.now(),
      });
    }

    await ctx.runMutation(internal.concepts.upsertConcepts, {
      ownerId,
      subjectId,
      clusters,
    });
    return { clusterCount: clusters.length };
  },
});

export const upsertConcepts = internalMutation({
  args: {
    ownerId: v.string(),
    subjectId: v.optional(v.id('subjects')),
    clusters: v.array(
      v.object({
        label: v.string(),
        chunkIds: v.array(v.id('chunks')),
        pageCount: v.number(),
        lastActiveAt: v.number(),
      }),
    ),
  },
  handler: async (ctx, { ownerId, subjectId, clusters }) => {
    const existing = subjectId
      ? await ctx.db
          .query('concepts')
          .withIndex('by_subject', (q) => q.eq('subjectId', subjectId))
          .collect()
      : await ctx.db
          .query('concepts')
          .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
          .collect();
    for (const doc of existing) await ctx.db.delete(doc._id);
    for (const c of clusters) {
      await ctx.db.insert('concepts', { ownerId, subjectId, ...c });
    }
  },
});

export const listConcepts = query({
  args: {},
  handler: async (ctx) => {
    const ownerId = await requireUser(ctx);
    return ctx.db
      .query('concepts')
      .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
      .order('desc')
      .collect();
  },
});

export const meshPayload = query({
  args: { subjectId: v.optional(v.id('subjects')) },
  handler: async (ctx, { subjectId }) => {
    const ownerId = await requireUser(ctx);
    if (subjectId) {
      const subject = await ctx.db.get(subjectId);
      if (!subject || subject.userId !== ownerId) return { nodes: [], edges: [] };
    }
    const concepts = subjectId
      ? await ctx.db
          .query('concepts')
          .withIndex('by_subject', (q) => q.eq('subjectId', subjectId))
          .collect()
      : await ctx.db
          .query('concepts')
          .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
          .collect();
    if (!concepts.length) return { nodes: [], edges: [] };

    const allChunks = subjectId
      ? await ctx.db
          .query('chunks')
          .withIndex('by_subject', (q) => q.eq('subjectId', subjectId))
          .collect()
      : await ctx.db
          .query('chunks')
          .withIndex('by_owner', (q) => q.eq('ownerId', ownerId))
          .collect();
    const chunkToConcept = new Map<string, string>();
    concepts.forEach((c, i) => {
      for (const cid of c.chunkIds) chunkToConcept.set(cid, `${c._id}:${i}`);
    });

    const kindCounts = new Map<string, Map<string, number>>();
    for (const c of allChunks) {
      const cid = chunkToConcept.get(c._id);
      if (!cid) continue;
      const m = kindCounts.get(cid) ?? new Map();
      m.set(c.kind, (m.get(c.kind) ?? 0) + 1);
      kindCounts.set(cid, m);
    }

    const nodes = concepts.map((c, i) => ({
      id: c._id,
      label: c.label,
      kind: majorityKind(kindCounts.get(`${c._id}:${i}`)),
      size: c.pageCount,
      color: PALETTE[i % PALETTE.length],
      clusterId: i,
    }));

    const edgeAcc = new Map<string, { w: number; n: number }>();
    const withEmb = allChunks.filter(
      (c): c is (typeof allChunks)[number] & { embedding: number[] } =>
        Boolean(c.embedding) && chunkToConcept.has(c._id),
    );
    for (let i = 0; i < withEmb.length; i++) {
      for (let j = i + 1; j < withEmb.length; j++) {
        const score = cosine(withEmb[i].embedding, withEmb[j].embedding);
        if (score < 0.55) continue;
        const a = chunkToConcept.get(withEmb[i]._id) ?? '';
        const b = chunkToConcept.get(withEmb[j]._id) ?? '';
        if (!a || !b || a === b) continue;
        const key = [a, b].sort().join(':');
        const acc = edgeAcc.get(key) ?? { w: 0, n: 0 };
        acc.w += score;
        acc.n += 1;
        edgeAcc.set(key, acc);
      }
    }

    const edges = [...edgeAcc.entries()].map(([key, acc]) => {
      const [source, target] = key.split(':');
      return { source, target, weight: Number((acc.w / acc.n).toFixed(3)) };
    });

    return { nodes, edges };
  },
});

function majorityKind(m?: Map<string, number>): string {
  if (!m || !m.size) return 'general';
  return [...m.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

export const conceptNotes = query({
  args: { conceptId: v.id('concepts') },
  handler: async (ctx, { conceptId }) => {
    const ownerId = await requireUser(ctx);
    const concept = await ctx.db.get(conceptId);
    if (!concept || concept.ownerId !== ownerId) {
      return null;
    }
    const pageIds = new Set<string>();
    for (const cid of concept.chunkIds) {
      const chunk = await ctx.db.get(cid);
      if (chunk) pageIds.add(chunk.pageId);
    }
    const notes: Array<{ pageId: string; fileName: string; notes: string }> =
      [];
    for (const pid of pageIds) {
      const page = await ctx.db.get(pid as Id<'pages'>);
      if (page?.notes) {
        notes.push({
          pageId: page._id,
          fileName: page.fileName,
          notes: page.notes,
        });
      }
    }
    return { label: concept.label, subjectId: concept.subjectId ?? null, notes };
  },
});

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i];
  return dot;
}
