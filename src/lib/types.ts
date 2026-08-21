import { z } from 'zod';

export const MODELS = {
  ocr: 'qwen/qwen3-vl-8b-instruct',
  utility: 'openai/gpt-oss-20b:free',
  grading: 'google/gemini-2.5-flash',
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
  studentAnswer: z.string(),
  score: z.number(),
  maxScore: z.number(),
  feedback: z.string(),
});
export const EvaluationResultSchema = z.object({
  items: z.array(EvaluationItem),
  totalAchieved: z.number(),
  totalPossible: z.number(),
});
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
