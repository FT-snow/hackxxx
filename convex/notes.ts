import { v } from 'convex/values';
import { action, internalMutation } from './_generated/server';
import { api, internal } from './_generated/api';
import { callOpenRouter } from './openrouter';
import { MODELS } from '../src/lib/types';

const NOTES_PROMPT = `You write compact revision notes for a student from a digitized handwritten notebook page.
Use the transcription and its labeled chunks below.

Output PLAIN TEXT exactly in this structure (omit sections with no content, keep under 180 words):

TL;DR: <one sentence>
KEY POINTS:
- <point>
FORMULAS:
- <name>: $<latex>$
DIAGRAMS:
- <type>: <caption>
RECALL:
Q: <question>
A: <short answer>

No preamble, no markdown headers.`;

export const generateForPage = action({
  args: { pageId: v.id('pages') },
  handler: async (ctx, { pageId }) => {
    const page = await ctx.runQuery(api.pages.get, { id: pageId });
    if (!page?.ocrText) throw new Error('Page has no transcription yet');
    const chunks = await ctx.runQuery(api.chunks.chunksByPage, { pageId });

    const chunkLines = chunks
      .map((c: { kind: string; conceptLabel?: string; text: string }) => `[${c.kind}${c.conceptLabel ? ` · ${c.conceptLabel}` : ''}] ${c.text}`)
      .join('\n\n');

    const raw = await callOpenRouter(
      MODELS.utility,
      [
        {
          role: 'user',
          content: `${NOTES_PROMPT}\n\nTRANSCRIPTION:\n${page.ocrText.slice(0, 6000)}\n\nCHUNKS:\n${chunkLines.slice(0, 6000)}`,
        },
      ],
      { temperature: 0.3, maxTokens: 1024 },
    );

    await ctx.runMutation(internal.notes.setNotes, { pageId, notes: raw });
    return raw;
  },
});

export const setNotes = internalMutation({
  args: { pageId: v.id('pages'), notes: v.string() },
  handler: async (ctx, { pageId, notes }) => {
    await ctx.db.patch(pageId, { notes });
  },
});
