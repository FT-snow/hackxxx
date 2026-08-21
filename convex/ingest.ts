import { v } from 'convex/values';
import { action } from './_generated/server';
import { api, internal } from './_generated/api';
import type { Id } from './_generated/dataModel';
import { callOpenRouter, callVision } from './openrouter';
import { DEMO_USER_ID } from './consts';
import { MODELS, TaggingResult } from '../src/lib/types';

const OCR_PROMPT = `Transcribe ALL text from this handwritten notebook page.
Rules:
- Preserve structure: headings, numbered questions, derivations, line breaks.
- Write math as LaTeX (e.g. $\\int_0^\\infty e^{-st}f(t)dt$).
- Diagrams/figures: do NOT describe as prose. Emit one line per diagram:
  [DIAGRAM: <type>: <caption>] where type is one of circuit|free-body|graph|block|flowchart|table|other
- Scribbled-out or corrected text: transcribe the struck-through content wrapped
  as [struck]...[/struck] immediately followed by the replacement text if legible.
- If a word is illegible write [?] in place of it.
Finish with a final line exactly:
CONFIDENCE: <float 0.0-1.0>`;

function splitChunks(ocrText: string): string[] {
  const parts = ocrText
    .split(
      /\n(?=\s*(?:\[DIAGRAM|(?:Q(?:uestion)?\.?\s*)?\d{1,2}[.)]\s|[A-Z][A-Za-z ]{3,40}:))/g,
    )
    .map((s) => s.trim())
    .filter(Boolean);
  const merged: string[] = [];
  for (const p of parts) {
    const last = merged[merged.length - 1];
    if (last && last.length + p.length < 400) {
      merged[merged.length - 1] = `${last}\n${p}`;
    } else {
      merged.push(p);
    }
  }
  return merged.length ? merged : [ocrText];
}

const TAG_PROMPT = (
  chunks: string[],
) => `You label chunks from a student's handwritten notes.
For EACH numbered chunk return an object in "chunks" (same order, same count):
{"text": <chunk text verbatim>, "kind": one of question|derivation|definition|example|diagram|general,
"conceptLabel": <short concept name e.g. "Laplace Transform">,
"tags": [<subject-level tags>],
"isRevision": true only if the chunk contains struck-through/corrected work,
"confidence": <0.0-1.0 transcription confidence>}

Chunks:
${chunks.map((c, i) => `${i + 1}. ${c}`).join('\n\n')}

Return ONLY JSON: {"chunks": [...]}`;

async function tagAndEmbed(
  ctx: { runMutation: Function },
  pageId: Id<'pages'>,
  ocrText: string,
  ocrConfidence?: number,
  subjectId?: Id<'subjects'>,
  ownerId: string = DEMO_USER_ID,
) {
  const texts = splitChunks(ocrText);
  let tagged: Array<{
    text: string;
    kind: string;
    conceptLabel?: string;
    tags?: string[];
    isRevision?: boolean;
    confidence?: number;
  }> = [];
  try {
    const tagRaw = await callOpenRouter(
      MODELS.utility,
      [{ role: 'user', content: TAG_PROMPT(texts) }],
      { json: true, temperature: 0.2, maxTokens: 8192 },
    );
    tagged = TaggingResult.parse(JSON.parse(tagRaw)).chunks;
  } catch {
    tagged = [];
  }

  const chunks = texts.map((text, i) => ({
    text,
    kind: tagged[i]?.kind ?? guessKind(text),
    conceptLabel: tagged[i]?.conceptLabel ?? guessConcept(text),
    tags: tagged[i]?.tags ?? [],
    isRevision: tagged[i]?.isRevision ?? /\[struck\]/i.test(text),
    confidence: tagged[i]?.confidence ?? ocrConfidence ?? 0.5,
  }));

  await ctx.runMutation(internal.chunks.insertChunks, {
    pageId,
    ownerId,
    subjectId,
    chunks,
  });
  await ctx.runMutation(api.pages.updateStatus, {
    id: pageId,
    status: 'tagged',
  });
  return chunks.length;
}

export const processFile = action({
  args: {
    base64Image: v.string(),
    fileName: v.string(),
    mimeType: v.string(),
    sessionId: v.string(),
    subjectId: v.optional(v.id('subjects')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const ownerId = identity?.subject ?? DEMO_USER_ID;
    const bin = atob(args.base64Image);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const storageId = await ctx.storage.store(
      new Blob([bytes], { type: args.mimeType }),
    );
    const pageId: Id<'pages'> = await ctx.runMutation(api.pages.createPage, {
      storageId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      sessionId: args.sessionId,
      subjectId: args.subjectId,
    });

    try {
      await ctx.runMutation(api.pages.updateStatus, {
        id: pageId,
        status: 'ocr',
      });

      const raw = await callVision(
        MODELS.ocr,
        OCR_PROMPT,
        `data:${args.mimeType};base64,${args.base64Image}`,
        { maxTokens: 4096, temperature: 0.1 },
      );

      const confMatch = raw.match(/CONFIDENCE:\s*([0-9.]+)/i);
      const ocrConfidence = confMatch ? Number(confMatch[1]) : undefined;
      const ocrText = raw.replace(/CONFIDENCE:.*$/im, '').trim();

      await ctx.runMutation(api.pages.setOcr, {
        id: pageId,
        ocrText,
        ocrConfidence,
      });

      const chunkCount = await tagAndEmbed(
        ctx,
        pageId,
        ocrText,
        ocrConfidence,
        args.subjectId,
        ownerId,
      );
      return { pageId, chunkCount };
    } catch (err) {
      await ctx.runMutation(api.pages.updateStatus, {
        id: pageId,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },
});

function guessKind(text: string): string {
  if (/^\s*\[DIAGRAM/i.test(text)) return 'diagram';
  if (/^(Q(?:uestion)?\.?\s*)?\d{1,2}[.)]\s/.test(text)) return 'question';
  if (/=\s*\$?\\/.test(text)) return 'derivation';
  if (/^(def|definition)/i.test(text)) return 'definition';
  return 'general';
}

function guessConcept(text: string): string {
  const heading = text.match(/^([A-Z][A-Za-z0-9 -]{3,40}):/m);
  if (heading) return heading[1].trim();
  const diag = text.match(/\[DIAGRAM:\s*[a-z-]+:\s*([^\]]+)\]/i);
  if (diag) return diag[1].trim().slice(0, 40);
  return 'Untitled';
}

export const processTextPage = action({
  args: {
    fileName: v.string(),
    sessionId: v.string(),
    text: v.string(),
    subjectId: v.optional(v.id('subjects')),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    const ownerId = identity?.subject ?? DEMO_USER_ID;
    const storageId = await ctx.storage.store(
      new Blob([args.text], { type: 'text/plain' }),
    );
    const pageId: Id<'pages'> = await ctx.runMutation(api.pages.createPage, {
      storageId,
      fileName: args.fileName,
      mimeType: 'application/pdf',
      sessionId: args.sessionId,
      subjectId: args.subjectId,
    });

    try {
      await ctx.runMutation(api.pages.updateStatus, {
        id: pageId,
        status: 'ocr',
      });
      await ctx.runMutation(api.pages.setOcr, {
        id: pageId,
        ocrText: args.text,
      });
      const chunkCount = await tagAndEmbed(
        ctx,
        pageId,
        args.text,
        undefined,
        args.subjectId,
        ownerId,
      );
      return { pageId, chunkCount };
    } catch (err) {
      await ctx.runMutation(api.pages.updateStatus, {
        id: pageId,
        status: 'error',
        error: err instanceof Error ? err.message : String(err),
      });
      throw err;
    }
  },
});
