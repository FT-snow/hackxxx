import { type NextRequest, NextResponse } from 'next/server';
import { requireUserFromRequest } from '@/lib/serverAuth';
import { callOpenRouter } from '@/../convex/openrouter';
import { MODELS } from '@/lib/types';

interface QuizQuestion {
  question: string;
  expectedAnswer: string;
  marks: number;
}

const GRADE_PROMPT = (
  questions: QuizQuestion[],
  answersText: string,
) => `Grade the student's answer sheet against this model paper.

MODEL PAPER (with expected answers):
${questions
  .map(
    (q, i) =>
      `Q${i + 1} [${q.marks} marks]: ${q.question}\nExpected: ${q.expectedAnswer}`,
  )
  .join('\n\n')}

STUDENT'S ANSWER SHEET:
${answersText}

Rules:
- Match each student answer to the question it responds to (by number or content). If a question is unanswered, award 0.
- Whole-number scores only. Partial credit for partially correct key points.
- Straight feedback per answer: what earned marks, what lost marks.

Output format exactly:
Question: <question text>
Student's Answer: <student's answer or "Not attempted">
Score: x/y
Feedback: <feedback>

Use \\n after every line. End with:
Total Marks Scored: x/y`;

export async function POST(request: NextRequest) {
  const user = await requireUserFromRequest(request);
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const { questions, answersText } = (await request.json()) as {
      questions?: QuizQuestion[];
      answersText?: string;
    };
    if (!Array.isArray(questions) || questions.length === 0 || !answersText) {
      return NextResponse.json(
        { error: 'Questions and answer sheet text are required' },
        { status: 400 },
      );
    }

    const evaluation = await callOpenRouter(
      MODELS.grading,
      [
        {
          role: 'system',
          content: 'You are a strict but fair examiner grading an exam.',
        },
        { role: 'user', content: GRADE_PROMPT(questions, answersText) },
      ],
      { temperature: 0.2, maxTokens: 8192 },
    );

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('Auto-grading failed:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to grade answers',
      },
      { status: 500 },
    );
  }
}
