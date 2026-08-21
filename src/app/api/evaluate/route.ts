import { type NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  console.log(
    'Attempting to use OpenRouter API Key:',
    OPENROUTER_API_KEY ? `...${OPENROUTER_API_KEY.slice(-4)}` : 'Not Found',
  );

  try {
    const { questionPaper, answerKey, studentAnswers } = await request.json();

    if (!questionPaper || !answerKey || !studentAnswers) {
      return NextResponse.json(
        {
          error: 'Question paper, answer key, and student answers are required',
        },
        { status: 400 },
      );
    }

    if (!OPENROUTER_API_KEY) {
      return NextResponse.json(
        { error: 'OpenRouter API key not configured' },
        { status: 500 },
      );
    }

    const prompt = `
Here is the question paper: ${questionPaper}
Here is the answer key: ${answerKey}
Here are the student's answers: ${studentAnswers}

1. Marking Process: Evaluate the student's answers against the question paper and the answer key. Full credit will be awarded for complete and accurate responses, partial credit for answers demonstrating partial understanding, minimal credit for vague or incomplete attempts, and no credit for incorrect or irrelevant responses.

2. Evaluation Methodology:
Multiple Choice Questions (MCQs): Assign full marks for correct answers and zero for incorrect ones.
Short Answer Questions: Evaluate based on key points, awarding partial credit for each correctly addressed point.
Essay Questions: Assess based on structure, coherence, argument depth, and relevance to the question. Partial credit will reflect the inclusion of relevant points and the quality of explanation.

3. AI Features:
Difficulty-based Marks Assignment: For each question, estimate its difficulty IF it is not specified in the question paper or answer key. The marks will be assigned in the question paper itself.
Scoring: Return whole-number scores only. Include straight feedback for improvement and highlight strengths in the answers.

4. Example Output:
Question: xyz
Student's Answer: xyz
Score: x/y
Feedback: xyz

5. Note: It is important to use \\n after every line to separate the questions, answers and the feedback. Strictly stick to the answers and questions provided by the user and do not add any additional question and answers on your own.

6. In the end calculate the total marks scored by the student.
`;

    const messages = [
      {
        role: 'system',
        content:
          'You are a teacher grading an exam. Provide detailed, constructive feedback for each answer.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ];

    const response = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'mistralai/mixtral-8x7b-instruct',
          messages,
          max_tokens: 10000,
          temperature: 0.3,
          top_p: 0.9,
          frequency_penalty: 0,
          presence_penalty: 0,
        }),
      },
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API error:', errorText);
      return NextResponse.json(
        { error: `OpenRouter API error: ${response.statusText}` },
        { status: 500 },
      );
    }

    const result = await response.json();
    const evaluation = result.choices[0]?.message?.content;

    if (!evaluation) {
      return NextResponse.json(
        { error: 'No evaluation received from AI' },
        { status: 500 },
      );
    }

    return NextResponse.json({ evaluation });
  } catch (error) {
    console.error('Error during evaluation:', error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Internal server error',
      },
      { status: 500 },
    );
  }
}
