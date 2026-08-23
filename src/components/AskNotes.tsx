'use client';

import { useAction } from 'convex/react';
import { Camera, Mic, MicOff } from 'lucide-react';
import { useRef, useState } from 'react';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import RichText from '@/components/RichText';

interface Exchange {
  question: string;
  answer: string;
  sources: string[];
}

interface SpeechRecognitionLike {
  lang: string;
  interimResults: boolean;
  onresult: ((ev: {
    results: { [key: number]: { [key: number]: { transcript: string } } };
  }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
  start: () => void;
  stop: () => void;
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result.slice(result.indexOf(',') + 1));
    };
    reader.onerror = () =>
      reject(reader.error ?? new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

export default function AskNotes({
  authToken,
  subjectId,
}: {
  authToken?: string;
  subjectId?: Id<'subjects'> | null;
}) {
  const askNotes = useAction(api.ask.askNotes);
  const processFile = useAction(api.ingest.processFile);
  const cameraRef = useRef<HTMLInputElement>(null);

  const [question, setQuestion] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<Exchange[]>([]);
  const [listening, setListening] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [captureMsg, setCaptureMsg] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);

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
      setHistory((h) => [
        { question: q, answer: r.answer, sources: r.sources },
        ...h,
      ]);
      setQuestion('');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ask failed');
    } finally {
      setBusy(false);
    }
  };

  const handleCapture = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || capturing) return;
    setCapturing(true);
    setError(null);
    setCaptureMsg('Transcribing your page…');
    try {
      await processFile({
        base64Image: await fileToBase64(file),
        fileName: file.name || `snap-${Date.now()}.jpg`,
        mimeType: file.type || 'image/jpeg',
        sessionId: crypto.randomUUID(),
        subjectId: subjectId ?? undefined,
      });
      setCaptureMsg('Page captured — it will appear in your notebook shortly.');
    } catch (e) {
      setCaptureMsg(null);
      setError(e instanceof Error ? e.message : 'Camera capture failed');
    } finally {
      setCapturing(false);
    }
  };

  const toggleMic = () => {
    if (listening) {
      recognitionRef.current?.stop();
      return;
    }
    const w = window as unknown as {
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
      SpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition ?? w.webkitSpeechRecognition;
    if (!SR) {
      setError('Voice input is not supported in this browser');
      return;
    }
    const recognition = new SR();
    recognitionRef.current = recognition;
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.onresult = (ev) => {
      const transcript = ev.results[0][0].transcript;
      setQuestion((q) => (q ? `${q} ${transcript}` : transcript));
    };
    recognition.onend = () => setListening(false);
    recognition.onerror = () => setListening(false);
    recognition.start();
    setListening(true);
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
          placeholder={listening ? 'Listening…' : 'Ask anything from your digitized notes…'}
          rows={2}
          className="flex-1 resize-none rounded-md border border-white/[0.08] bg-[#0c0f0d] p-3 font-mono text-xs text-gray-200 outline-none focus:border-[#E9C468]/40"
        />
        <div className="flex h-fit gap-2">
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            disabled={capturing}
            title="Snap a page and add it to your notebook"
            aria-label="Camera capture"
            className={`cursor-pointer rounded-md border px-3 py-2.5 transition-colors ${
              capturing
                ? 'cursor-wait border-[#E9C468]/40 bg-[#E9C468]/10'
                : 'border-white/[0.08] bg-[#0c0f0d] hover:border-[#E9C468]/40'
            }`}
          >
            <Camera className="h-4 w-4 text-[#E9C468]" />
          </button>
          <button
            type="button"
            onClick={toggleMic}
            title={listening ? 'Stop listening' : 'Ask by voice'}
            aria-label="Voice input"
            className={`cursor-pointer rounded-md border px-3 py-2.5 transition-colors ${
              listening
                ? 'animate-pulse border-red-400/60 bg-red-500/10'
                : 'border-white/[0.08] bg-[#0c0f0d] hover:border-[#E9C468]/40'
            }`}
          >
            {listening ? (
              <MicOff className="h-4 w-4 text-red-300" />
            ) : (
              <Mic className="h-4 w-4 text-[#E9C468]" />
            )}
          </button>
          <button
            type="button"
            onClick={ask}
            disabled={busy || !question.trim()}
            className="label-meta cursor-pointer rounded-md bg-[#E9C468] px-4 py-2.5 text-xs text-black transition-colors hover:bg-[#F0D284] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy ? 'Thinking…' : 'Ask →'}
          </button>
        </div>
      </div>

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleCapture}
      />

      {(captureMsg || listening) && (
        <p className="label-meta mt-2 text-[#C8A45C]">
          {captureMsg ?? 'Listening — speak your question'}
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-300">{error}</p>}

      {history.length > 0 && (
        <div className="mt-5 space-y-4">
          {history.map((h, i) => (
            <div
              key={i}
              className="rounded-md border border-white/[0.06] bg-[#0c0f0d] p-4"
            >
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
