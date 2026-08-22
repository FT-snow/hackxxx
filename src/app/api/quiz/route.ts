import { type NextRequest, NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/serverAuth';
import { callOpenRouter } from '@/../convex/openrouter';
import { MODELS } from '@/lib/types';

const QUIZ_PROMPT = (
  topics: string[],
) => `You are an examiner setting a surprise test for an engineering student.
Write exactly 5 questions drawn ONLY from these topics from the student's own notes:
${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

Mix difficulty: 2 short-answer (marks 5), 2 medium derivations/numeric (marks 10), 1 long application (marks 15).
Each question must be self-contained and answerable in a few sentences.

Return ONLY JSON:
{"questions":[{"question":"...","expectedAnswer":"model answer in 3-6 sentences","marks":10}]}`;

export async function POST(request: NextRequest) {
  const user = await requireUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { topics } = (await request.json()) as { topics?: string[] };
    if (!Array.isArray(topics) || topics.length === 0) {
      return NextResponse.json(
        { error: 'No topics available — capture some notebook pages first' },
        { status: 400 },
      );
    }

    const raw = await callOpenRouter(
      MODELS.grading,
      [
        {
          role: 'system',
          content: 'You are a precise exam setter. Output valid JSON only.',
        },
        { role: 'user', content: QUIZ_PROMPT(topics.slice(0, 12)) },
      ],
      { json: true, temperature: 0.7, maxTokens: 4096 },
    );

    const parsed = JSON.parse(raw) as {
      questions?: Array<{
        question: string;
        expectedAnswer: string;
        marks?: number;
      }>;
    };
    const questions = (parsed.questions ?? [])
      .filter((q) => q.question && q.expectedAnswer)
      .map((q) => ({
        question: String(q.question),
        expectedAnswer: String(q.expectedAnswer),
        marks: Number(q.marks) || 10,
      }));
    if (questions.length === 0) throw new Error('Empty quiz');

    return NextResponse.json({ questions });
  } catch (error) {
    console.error('Quiz generation failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : 'Failed to generate questions',
      },
      { status: 500 },
    );
  }
}
