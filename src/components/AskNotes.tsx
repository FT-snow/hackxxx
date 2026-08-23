'use client';

import { useAction } from 'convex/react';
import { useState } from 'react';
import { api } from '@/convex/_generated/api';
import RichText from '@/components/RichText';

interface Exchange {
  question: string;
  answer: string;
  sources: string[];
}

export default function AskNotes({ authToken }: { authToken?: string }) {
  const askNotes = useAction(api.ask.askNotes);
  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Exchange[]>([]);

  const ask = async () => {
    const q = question.trim();
    if (!q || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch('/api/embed', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
        },
        body: JSON.stringify({ texts: [q] }),
      });
      if (!res.ok) throw new Error('Could not embed the question');
      const data = (await res.json()) as { embeddings: number[][] };

      const r = await askNotes({ question: q, embedding: data.embeddings[0] });
      setHistory((h) => [{ question: q, answer: r.answer, sources: r.sources }, ...h]);
      setQuestion('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ask failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-lg border border-white/[0.08] bg-black p-5">
      <span className="label-meta text-[#C8A45C]">Ask your notes</span>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row">
        <textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              ask();
            }
          }}
          placeholder="Ask anything from your digitized notes…"
          rows={2}
          className="flex-1 resize-none rounded-md border border-white/[0.08] bg-[#0c0f0d] p-3 font-mono text-xs text-gray-200 outline-none focus:border-[#E9C468]/40"
        />
        <button
          type="button"
          onClick={ask}
          disabled={busy || !question.trim()}
          className="label-meta h-fit cursor-pointer rounded-md bg-[#E9C468] px-4 py-2.5 text-xs text-black transition-colors hover:bg-[#F0D284] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busy ? 'Thinking…' : 'Ask →'}
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

      {history.length > 0 && (
        <div className="mt-5 space-y-4">
          {history.map((h, i) => (
            <div key={i} className="rounded-md border border-white/[0.06] bg-[#0c0f0d] p-4">
              <p className="text-sm font-bold text-white">{h.question}</p>
              <div className="mt-2 font-mono text-xs leading-relaxed text-gray-300 [&_.katex]:text-[0.95rem]">
                <RichText text={h.answer} />
              </div>
              {h.sources.length > 0 && (
                <p className="label-meta mt-3 text-gray-500">
                  From: {h.sources.join(', ')}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
