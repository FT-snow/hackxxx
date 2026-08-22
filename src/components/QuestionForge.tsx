'use client';

import { useAction, useQuery } from 'convex/react';
import { useState } from 'react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';

type QuizItem = {
  question: string;
  answer: string;
  maxScore: number;
};

const PRESETS = [5, 10, 15, 20];

export default function QuestionForge() {
  const subjects = useQuery(api.subjects.listMine, {}) as
    | Array<{ _id: Id<'subjects'>; name: string }>
    | undefined;
  const generateQuizSet = useAction(api.evaluate.generateQuizSet);

  const [count, setCount] = useState(10);
  const [customCount, setCustomCount] = useState('');
  const [subjectId, setSubjectId] = useState<Id<'subjects'> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<QuizItem[]>([]);
  const [revealed, setRevealed] = useState<Record<number, boolean>>({});

  const effectiveCount =
    customCount.trim() !== '' ? Number(customCount) || count : count;

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    setItems([]);
    setRevealed({});
    try {
      const res = await generateQuizSet({
        count: effectiveCount,
        subjectId: subjectId ?? undefined,
      });
      setItems(res as QuizItem[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not generate questions');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/[0.08] bg-black p-6">
      <span className="label-meta text-[#C8A45C]">Question forge</span>
      <h2 className="font-display mt-2 text-lg text-white">
        Generate practice questions
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Pick how many questions you need — built from your own digitized pages.
      </p>

      <div className="mt-5 flex flex-col gap-4 lg:flex-row lg:items-end">
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => {
                setCount(n);
                setCustomCount('');
              }}
              className={`label-meta cursor-pointer rounded-md border px-3.5 py-2 transition-colors ${
                effectiveCount === n && customCount.trim() === ''
                  ? 'border-[#E9C468]/70 bg-[#E9C468]/10 text-[#E9C468]'
                  : 'border-white/[0.08] text-gray-400 hover:text-white'
              }`}
            >
              {n} Qs
            </button>
          ))}
          <input
            type="number"
            min={1}
            max={20}
            value={customCount}
            onChange={(e) => setCustomCount(e.target.value)}
            placeholder="Custom"
            className="label-meta w-24 rounded-md border border-white/[0.08] bg-transparent px-3 py-2 text-gray-300 outline-none placeholder:text-gray-600 focus:border-[#E9C468]/50"
          />
        </div>

        <select
          value={subjectId ?? ''}
          onChange={(e) =>
            setSubjectId(
              e.target.value ? (e.target.value as Id<'subjects'>) : null,
            )
          }
          className="label-meta cursor-pointer rounded-md border border-white/[0.08] bg-black px-3 py-2 text-gray-300 outline-none focus:border-[#E9C468]/50"
        >
          <option value="">All subjects</option>
          {(subjects ?? []).map((s) => (
            <option key={s._id} value={s._id}>
              {s.name}
            </option>
          ))}
        </select>

        <button
          type="button"
          onClick={run}
          disabled={busy}
          className="label-meta cursor-pointer rounded-md bg-[#E9C468] px-5 py-2.5 text-xs text-black transition-colors hover:bg-[#F0D284] disabled:cursor-wait disabled:opacity-60 lg:ml-auto"
        >
          {busy ? 'Forging…' : `Generate ${effectiveCount} →`}
        </button>
      </div>

      {error && <p className="mt-4 text-sm text-red-300">{error}</p>}

      {items.length > 0 && (
        <ol className="mt-6 space-y-3">
          {items.map((q, i) => (
            <li
              key={`q-${i}`}
              className="rounded-md border border-white/[0.08] bg-[#0c0f0d] p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <p className="text-sm leading-relaxed text-gray-200">
                  <span className="mr-2 text-[#E9C468]">Q{i + 1}.</span>
                  {q.question}
                </p>
                <span className="label-meta shrink-0 text-gray-500">
                  {q.maxScore} mk
                </span>
              </div>
              {revealed[i] ? (
                <p className="mt-3 rounded-sm border-l-2 border-[#E9C468]/40 bg-[#E9C468]/[0.04] p-3 text-sm leading-relaxed text-gray-400">
                  {q.answer}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() =>
                    setRevealed((r) => ({ ...r, [i]: true }))
                  }
                  className="label-meta mt-3 cursor-pointer text-gray-500 transition-colors hover:text-[#E9C468]"
                >
                  Show answer ↓
                </button>
              )}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
