'use client';

import { useAction } from 'convex/react';
import { useState } from 'react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type Phase = 'idle' | 'question' | 'graded';

interface GradeResult {
  items: Array<{
    question: string;
    studentAnswer: string;
    score: number;
    maxScore: number;
    feedback: string;
  }>;
  totalAchieved: number;
  totalPossible: number;
}

export default function ConceptQuiz({ conceptId }: { conceptId: string }) {
  const generateQuestion = useAction(api.evaluate.generateQuestion);
  const gradeAnswer = useAction(api.evaluate.gradeAnswer);

  const [phase, setPhase] = useState<Phase>('idle');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [question, setQuestion] = useState('');
  const [maxScore, setMaxScore] = useState(0);
  const [answer, setAnswer] = useState('');
  const [result, setResult] = useState<GradeResult | null>(null);

  const start = async () => {
    setBusy(true);
    setError(null);
    try {
      const q = await generateQuestion({
        conceptId: conceptId as Id<'concepts'>,
      });
      setQuestion(q.question);
      setMaxScore(q.maxScore);
      setAnswer('');
      setResult(null);
      setPhase('question');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not create question');
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    if (!answer.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await gradeAnswer({
        conceptId: conceptId as Id<'concepts'>,
        question,
        studentAnswer: answer,
        maxScore,
      });
      setResult(r);
      setPhase('graded');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Grading failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mt-4 rounded-md border border-white/[0.08] bg-[#0c0f0d] p-3">
      <span className="label-meta text-[#C8A45C]">Surprise test</span>

      {phase === 'idle' && (
        <button
          type="button"
          onClick={start}
          disabled={busy}
          className="label-meta mt-3 w-full cursor-pointer rounded-md bg-[#E9C468] px-3 py-2 text-xs text-black transition-colors hover:bg-[#F0D284] disabled:cursor-wait disabled:opacity-60"
        >
          {busy ? 'Summoning a question…' : 'Test me on this topic →'}
        </button>
      )}

      {phase === 'question' && (
        <div className="mt-3 space-y-3">
          <p className="text-sm leading-relaxed text-gray-200">{question}</p>
          <p className="label-meta text-gray-500">For {maxScore} marks</p>
          <textarea
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            placeholder="Write your answer from memory…"
            rows={4}
            className="w-full resize-none rounded-md border border-white/[0.08] bg-black p-2.5 font-mono text-xs text-gray-200 outline-none focus:border-[#5FD6C4]/40"
          />
          <button
            type="button"
            onClick={submit}
            disabled={busy || !answer.trim()}
            className="label-meta w-full cursor-pointer rounded-md bg-[#5FD6C4] px-3 py-2 text-xs text-black transition-colors hover:bg-[#4FC2B1] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Grading…' : 'Submit for grading'}
          </button>
        </div>
      )}

      {phase === 'graded' && result && (
        <div className="mt-3 space-y-3">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-2xl text-white">
              {result.totalAchieved}
              <span className="text-sm text-gray-500">
                /{result.totalPossible}
              </span>
            </span>
            <span className="label-meta text-[#5FD6C4]">
              {result.totalPossible > 0
                ? Math.round((result.totalAchieved / result.totalPossible) * 100)
                : 0}
              %
            </span>
          </div>
          {result.items.map((item, i) => (
            <div key={i} className="rounded border border-white/[0.06] p-2.5">
              <p className="label-meta text-gray-400">
                Score {item.score}/{item.maxScore}
              </p>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-300">
                {item.feedback}
              </p>
            </div>
          ))}
          <button
            type="button"
            onClick={start}
            disabled={busy}
            className="label-meta w-full cursor-pointer rounded-md border border-white/[0.08] px-3 py-2 text-xs text-gray-300 transition-colors hover:border-[#E9C468]/40 hover:text-[#E9C468] disabled:cursor-wait disabled:opacity-60"
          >
            {busy ? 'Working…' : 'Another question ↻'}
          </button>
        </div>
      )}

      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}
    </div>
  );
}
