import { v } from 'convex/values';
import { action } from './_generated/server';
import type { Id } from './_generated/dataModel';
import { requireUser } from './helpers';
import { callOpenRouter } from './openrouter';
import { MODELS } from '../src/lib/types';

interface ChunkHit {
  _id: Id<'chunks'>;
  _score: number;
  text: string;
  conceptLabel?: string;
}

export const askNotes = action({
  args: {
    question: v.string(),
    embedding: v.array(v.number()),
  },
  handler: async (ctx, { question, embedding }) => {
    const ownerId = await requireUser(ctx);

    const hits = (await ctx.vectorSearch('chunks', 'by_embedding', {
      vector: embedding,
      limit: 8,
      filter: (q) => q.eq('ownerId', ownerId),
    })) as unknown as ChunkHit[];

    const context = hits
      .map((h, i) => `[${i + 1}] ${h.text}`)
      .join('\n---\n')
      .slice(0, 6000);
    if (!context.trim()) {
      throw new Error(
        'No digitized notes found yet — capture a few pages first',
      );
    }

    const answer = await callOpenRouter(
      MODELS.utility,
      [
        {
          role: 'system',
          content:
            'You are Mimir, a study assistant. Answer ONLY from the provided notes. If the notes do not contain enough information, say so plainly instead of guessing. Write math in LaTeX between $...$ (display math $$...$$). Be concise and exam-focused.',
        },
        {
          role: 'user',
          content: `Notes:\n${context}\n\nQuestion: ${question}`,
        },
      ],
      { temperature: 0.3, maxTokens: 2048 },
    );

    const sources = [
      ...new Set(
        hits
          .map((h) => h.conceptLabel?.trim())
          .filter((l): l is string => Boolean(l)),
      ),
    ];

    return { answer: answer.trim(), sources };
  },
});
