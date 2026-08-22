import { v } from 'convex/values';
import { z } from 'zod';
import { action } from './_generated/server';
import type { ActionCtx } from './_generated/server';
import { api } from './_generated/api';
import { requireUser } from './helpers';
import { callOpenRouter, parseJsonLoose } from './openrouter';
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
    return GeneratedQuestion.parse(parseJsonLoose(raw));
  },
});

const QuizSetItem = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
  maxScore: z.number().int().positive(),
});

export const generateQuizSet = action({
  args: {
    count: v.number(),
    subjectId: v.optional(v.id('subjects')),
  },
  handler: async (ctx, { count, subjectId }) => {
    await requireUser(ctx);
    const n = Math.max(1, Math.min(20, Math.round(count)));
    const chunks = await ctx.runQuery(api.chunks.allForOwner, {});
    const pool = subjectId
      ? chunks.filter((c) => c.subjectId === subjectId)
      : chunks;
    if (!pool.length)
      throw new Error('No digitized notes found to build questions from');
    const source = pool
      .map((c) => c.text)
      .join('\n---\n')
      .slice(0, 12000);
    const raw = await callOpenRouter(
      MODELS.utility,
      [
        {
          role: 'user',
          content: `Create exactly ${n} exam-style practice questions strictly answerable from ONLY these notes. Vary difficulty. Each item: {"question": string, "answer": string (model answer for grading reference), "maxScore": number of marks}. Return ONLY JSON: {"items": [...]} with ${n} items.\n\nNotes:\n${source}`,
        },
      ],
      { json: true, temperature: 0.6, maxTokens: 4096 },
    );
    const parsed = z
      .object({ items: z.array(QuizSetItem).min(1) })
      .parse(parseJsonLoose(raw));
    return parsed.items.slice(0, n);
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
    return EvaluationResultSchema.parse(parseJsonLoose(raw));
  },
});
