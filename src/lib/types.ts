import { z } from 'zod';

export const MODELS = {
  ocr: 'qwen/qwen3-vl-8b-instruct',
  utility: 'openai/gpt-oss-20b',
  grading: 'openai/gpt-oss-20b',
} as const;

export const EMBEDDING_DIMS = 384;

export const ChunkKind = z.enum([
  'question',
  'derivation',
  'definition',
  'example',
  'diagram',
  'general',
]);
export type ChunkKind = z.infer<typeof ChunkKind>;

export const TaggingResult = z.object({
  chunks: z.array(
    z.object({
      text: z.string(),
      kind: ChunkKind,
      conceptLabel: z.string(),
      tags: z.array(z.string()),
      isRevision: z.boolean(),
      confidence: z.number().min(0).max(1),
    }),
  ),
});
export type TaggingResult = z.infer<typeof TaggingResult>;

export const EvaluationItem = z.object({
  question: z.string(),
  studentAnswer: z.string().default(''),
  score: z.coerce.number(),
  maxScore: z.coerce.number(),
  feedback: z.string().default(''),
});
export const EvaluationResultSchema = z
  .object({
    items: z.array(EvaluationItem),
    totalAchieved: z.coerce.number().default(0),
    totalPossible: z.coerce.number().default(0),
  })
  .transform((r) => ({
    ...r,
    totalAchieved:
      r.totalAchieved ||
      r.items.reduce((s, i) => s + (Number.isFinite(i.score) ? i.score : 0), 0),
    totalPossible:
      r.totalPossible ||
      r.items.reduce(
        (s, i) => s + (Number.isFinite(i.maxScore) ? i.maxScore : 0),
        0,
      ),
  }));
export type EvaluationResultData = z.infer<typeof EvaluationResultSchema>;

export interface MeshNode {
  id: string;
  label: string;
  kind: string;
  size: number;
  color: string;
  clusterId: number;
}

export interface MeshEdge {
  source: string;
  target: string;
  weight: number;
}

export interface MeshPayload {
  nodes: MeshNode[];
  edges: MeshEdge[];
}
