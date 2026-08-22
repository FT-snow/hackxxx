import { v } from 'convex/values';
import { z } from 'zod';
import { action } from './_generated/server';
import type { ActionCtx } from './_generated/server';
import { api } from './_generated/api';
import { requireUser } from './helpers';
import { callOpenRouter } from './openrouter';
import { MODELS, EvaluationResultSchema } from '../src/lib/types';

interface ConceptLike {
  _id: string;
  chunkIds: string[];
}
interface ChunkLike {
  _id: string;
  text: string;
}

async function conceptTexts(
  ctx: ActionCtx,
  conceptId: string,
): Promise<string[]> {
  await requireUser(ctx);
  const concepts: ConceptLike[] = await ctx.runQuery(
    api.concepts.listConcepts,
    {},
  );
  const target = concepts.find((c) => c._id === conceptId);
  if (!target) throw new Error('Concept not found');
  const chunks: ChunkLike[] = await ctx.runQuery(api.chunks.allForOwner, {});
  const ids = new Set<string>(target.chunkIds);
  return chunks.filter((c) => ids.has(c._id)).map((c) => c.text);
}

const GeneratedQuestion = z.object({
  question: z.string().min(1),
  maxScore: z.number().int().positive(),
});

export const generateQuestion = action({
  args: { conceptId: v.id('concepts') },
  handler: async (ctx, { conceptId }) => {
    const texts = await conceptTexts(ctx, conceptId);
    if (!texts.length) throw new Error('No notes in this concept yet');
    const raw = await callOpenRouter(
      MODELS.utility,
      [
        {
          role: 'user',
          content: `Create ONE exam-style practice question strictly answerable from ONLY these notes. Return JSON {"question": string, "maxScore": number}.\n\nNotes:\n${texts.join('\n---\n')}`,
        },
      ],
      { json: true, temperature: 0.7, maxTokens: 1024 },
    );
    return GeneratedQuestion.parse(JSON.parse(raw));
  },
});

export const gradeAnswer = action({
  args: {
    conceptId: v.id('concepts'),
    question: v.string(),
    studentAnswer: v.string(),
    maxScore: v.number(),
  },
  handler: async (ctx, args) => {
    const texts = await conceptTexts(ctx, args.conceptId);
    const raw = await callOpenRouter(
      MODELS.grading,
      [
        {
          role: 'system',
          content:
            'You are a fair teacher grading an exam answer. Whole-number scores only. Award partial credit for correct steps. Grade strictly against the reference notes.',
        },
        {
          role: 'user',
          content: `Question (${args.maxScore} marks): ${args.question}\n\nReference notes:\n${texts.join('\n---\n')}\n\nStudent answer: ${args.studentAnswer}\n\nReturn JSON {"items":[{"question","studentAnswer","score","maxScore","feedback"}],"totalAchieved","totalPossible"}`,
        },
      ],
      { json: true, temperature: 0.2, maxTokens: 4096 },
    );
    return EvaluationResultSchema.parse(JSON.parse(raw));
  },
});
