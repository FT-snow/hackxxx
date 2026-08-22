'use client';

import { useAction, useMutation, useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useState } from 'react';
import AuthGate from '@/components/AuthGate';
import MeshCanvas from '@/components/mesh/MeshCanvas';
import ConceptQuiz from '@/components/mesh/ConceptQuiz';
import Navbar from '@/components/Navbar';
import RichText from '@/components/RichText';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import type { MeshNode } from '@/lib/types';

type ConceptNotesResult = {
  label: string;
  subjectId: string | null;
  notes: Array<{ pageId: string; fileName: string; notes: string }>;
} | null;

function RenameLabel({
  conceptId,
  initial,
}: {
  conceptId: string;
  initial: string;
}) {
  const rename = useMutation(api.concepts.renameConcept);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <div className="flex items-start justify-between gap-2 pr-4">
        <h3 className="font-display text-lg">{initial}</h3>
        <button
          type="button"
          onClick={() => {
            setValue(initial);
            setEditing(true);
          }}
          className="label-meta mt-1 cursor-pointer text-gray-500 transition-colors hover:text-[#E9C468]"
          aria-label="Rename concept"
        >
          Rename
        </button>
      </div>
    );
  }

  return (
    <div className="pr-4">
      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') void e;
        }}
        maxLength={60}
        autoFocus
        className="font-display w-full rounded-md border border-[#E9C468]/40 bg-black px-2 py-1.5 text-base text-white outline-none focus:border-[#E9C468]"
        placeholder="Concept name"
      />
      {error && <p className="mt-1.5 text-xs text-red-300">{error}</p>}
      <div className="mt-2 flex gap-2">
        <button
          type="button"
          disabled={busy || !value.trim()}
          onClick={() => {
            setBusy(true);
            setError(null);
            rename({ conceptId: conceptId as Id<'concepts'>, label: value })
              .then(() => setEditing(false))
              .catch((e) =>
                setError(e instanceof Error ? e.message : 'Rename failed'),
              )
              .finally(() => setBusy(false));
          }}
          className="label-meta cursor-pointer rounded-md bg-[#E9C468] px-3 py-1.5 text-xs text-black hover:bg-[#F0D284] disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="label-meta cursor-pointer rounded-md border border-white/[0.08] px-3 py-1.5 text-xs text-gray-400 hover:text-white"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

function NotesSection({ conceptId }: { conceptId: string }) {
  const data = useQuery(api.concepts.conceptNotes, {
    conceptId: conceptId as Id<'concepts'>,
  }) as ConceptNotesResult | undefined;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  if (data === undefined) {
    return (
      <p className="label-meta mt-4 animate-pulse text-gray-500">
        Loading notes…
      </p>
    );
  }
  if (data === null) {
    return <p className="label-meta mt-4 text-gray-600">Unavailable.</p>;
  }
  if (data.notes.length === 0) {
    return (
      <p className="label-meta mt-4 text-gray-600">
        No revision notes yet for this topic.
      </p>
    );
  }
  return (
    <div className="mt-4 space-y-2">
      <span className="label-meta text-[#C8A45C]">Revision notes</span>
      {data.notes.map((n) => {
        const open = Boolean(expanded[n.pageId]);
        return (
          <div
            key={n.pageId}
            className="rounded-md border border-white/[0.08] bg-[#0c0f0d] p-3"
          >
            <p className="label-meta truncate text-gray-400">{n.fileName}</p>
            <div
              className={`mt-2 font-mono text-xs leading-relaxed text-gray-300 [&_.katex]:text-[0.95rem] ${open ? '' : 'line-clamp-6'}`}
            >
              <RichText text={n.notes} />
            </div>
            <button
              type="button"
              onClick={() =>
                setExpanded((e) => ({ ...e, [n.pageId]: !e[n.pageId] }))
              }
              className="label-meta mt-2 cursor-pointer text-gray-500 transition-colors hover:text-[#E9C468]"
            >
              {open ? 'Show less −' : 'Show more +'}
            </button>
          </div>
        );
      })}
    </div>
  );
}

export default function MeshPage() {
  const [selected, setSelected] = useState<MeshNode | null>(null);
  const payload = useQuery(api.concepts.meshPayload, {});
  const rebuildConcepts = useAction(api.concepts.rebuildConcepts);
  const [rebuilding, setRebuilding] = useState(false);
  const [rebuildMsg, setRebuildMsg] = useState<string | null>(null);

  const handleRebuild = () => {
    if (rebuilding) return;
    setRebuilding(true);
    setRebuildMsg(null);
    rebuildConcepts({})
      .then(() => {
        setRebuildMsg('Mesh rebuilt');
        setTimeout(() => setRebuildMsg(null), 2500);
      })
      .catch(() => {
        setRebuildMsg('Rebuild failed — digitize pages first');
      })
      .finally(() => setRebuilding(false));
  };

  const active = payload && payload.nodes.length > 0 ? payload : null;

  const legend = [
    ...new Map((active?.nodes ?? []).map((n) => [n.color, n.label])).entries(),
  ];

  return (
    <AuthGate>
      <div className="relative min-h-screen overflow-x-clip bg-black text-white">
        <Navbar />
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-5"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23E9C468' fill-opacity='0.1'%3E%3Ctext x='10' y='30' font-size='8' fill='%23E9C468'%3E%E1%9B%97%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
        <div className="relative z-20 pt-20">
          <div className="mr-auto ml-0 max-w-5xl px-6 sm:px-10 lg:px-20">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h1 className="font-display mb-2 text-3xl sm:text-5xl">
                Concept <span className="text-gray-400">Mesh</span>
              </h1>
              <p className="max-w-xl text-sm leading-relaxed text-gray-500">
                Topics as nodes. Threads of similarity between them — every
                revision you ever wrote, woven in.
              </p>
            </motion.div>
          </div>

          <div className="relative h-[calc(100vh-12rem)] w-full">
            {payload === undefined ? (
              <div className="flex h-full items-center justify-center">
                <p className="animate-pulse text-sm text-gray-400">
                  Indexing your notes…
                </p>
              </div>
            ) : !active ? (
              <div className="flex h-full flex-col items-center justify-center px-6 text-center">
                <h3 className="font-display text-xl text-white">
                  Your mesh is empty
                </h3>
                <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500">
                  Digitize a few notebook pages or PDFs and your concepts will
                  appear here, linked by similarity.
                </p>
                <Link
                  href="/notebook"
                  className="label-meta mt-6 rounded-md bg-[#E9C468] px-5 py-2.5 text-xs text-black transition-colors hover:bg-[#F0D284]"
                >
                  Digitize notes →
                </Link>
              </div>
            ) : (
              <>
                <MeshCanvas payload={active} onNodeClick={setSelected} />
                <div className="absolute bottom-4 left-4 z-30 flex flex-wrap gap-2">
                  {legend.map(([color, label]) => (
                    <span
                      key={color}
                      className="flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-[10px] text-gray-300"
                    >
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: color }}
                      />
                      {label}
                    </span>
                  ))}
                </div>
                <div className="absolute right-4 bottom-4 z-30 flex items-center gap-3">
                  {rebuildMsg && (
                    <span className="label-meta text-[#E9C468]">
                      {rebuildMsg}
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleRebuild}
                    disabled={rebuilding}
                    className="label-meta cursor-pointer rounded-md border border-[#E9C468]/40 bg-black/70 px-4 py-2 text-xs text-[#E9C468] backdrop-blur transition-colors hover:bg-[#E9C468]/10 disabled:cursor-wait disabled:opacity-60"
                  >
                    {rebuilding ? 'Rebuilding…' : 'Rebuild mesh'}
                  </button>
                </div>
              </>
            )}

            {selected && (
              <motion.aside
                initial={{ opacity: 0, x: 24 }}
                animate={{ opacity: 1, x: 0 }}
                className="absolute top-20 right-4 z-30 max-h-[70vh] w-80 overflow-y-auto rounded-lg border border-white/[0.08] bg-black/80 p-4 backdrop-blur"
              >
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="absolute top-2 right-3 text-gray-500 hover:text-white"
                  aria-label="Close"
                >
                  ×
                </button>
                <RenameLabel
                  conceptId={selected.id}
                  initial={selected.label}
                />
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded-md bg-[#E9C468]/10 px-2 py-0.5 text-[10px] tracking-wide text-[#E9C468] uppercase">
                    {selected.kind}
                  </span>
                  <span className="text-xs text-gray-400">
                    {selected.size} pages linked
                  </span>
                </div>
              <NotesSection conceptId={selected.id} />
              <ConceptQuiz conceptId={selected.id} />
            </motion.aside>
            )}
          </div>
        </div>
      </div>
    </AuthGate>
  );
}
