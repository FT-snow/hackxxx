'use client';

import { useEffect, useState } from 'react';

import { useAction, useQuery } from 'convex/react';
import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { api } from '@/convex/_generated/api';
import type { Id } from '@/convex/_generated/dataModel';
import NotebookCapture from '@/components/NotebookCapture';
import SubjectPicker from '@/components/SubjectPicker';
import AuthGate from '@/components/AuthGate';

export default function NotebookPage() {
  const [subjectId, setSubjectId] = useState<Id<'subjects'> | null>(null);
  const [seedBusy, setSeedBusy] = useState(false);
  const [seedError, setSeedError] = useState<string | null>(null);
  const subjects = useQuery(api.subjects.listMine, {}) as
    | Array<{ _id: Id<'subjects'>; name: string }>
    | undefined;
  const seedQuantumDemo = useAction(api.seed.seedQuantumDemo);

  useEffect(() => {
    if (!subjectId && subjects && subjects.length > 0) {
      setSubjectId(subjects[0]._id);
    }
  }, [subjectId, subjects]);

  const handleSeed = async () => {
    if (seedBusy) return;
    setSeedBusy(true);
    setSeedError(null);
    try {
      const res = await seedQuantumDemo({});
      setSubjectId(res.subjectId as Id<'subjects'>);
    } catch (e) {
      setSeedError(
        e instanceof Error ? e.message : 'Could not load quantum mechanics demo',
      );
    } finally {
      setSeedBusy(false);
    }
  };

  return (
    <AuthGate>
      <div className="min-h-screen bg-black text-white relative overflow-hidden">
      <Navbar />
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5 z-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%235FD6C4' fill-opacity='0.1'%3E%3Ctext x='10' y='30' font-size='8' fill='%235FD6C4'%3E01%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      {/* Main Content */}
      <div className="relative z-20 min-h-screen">
        <div className="mx-auto max-w-6xl px-6 pb-16 pt-28">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-10 max-w-2xl"
          >
            <h1 className="font-display mb-4 text-4xl leading-tight sm:text-5xl">
              Capture a page.
              <br />
              <span className="text-gray-400">Grow the mesh.</span>
            </h1>

            <p className="text-base leading-relaxed text-gray-500">
              Snap your handwritten pages. Mimir transcribes each one, tags
              every concept, and links it into your personal index.
            </p>
          </motion.div>

          {/* Subject selection */}
          <SubjectPicker value={subjectId} onChange={setSubjectId} />

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.45 }}
            className="mt-6 rounded-lg border border-[#E9C468]/20 bg-[#241d10]/40 p-5"
          >
              <span className="label-meta text-[#C8A45C]">Quantum Demo</span>
              <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="font-display text-lg text-white">
                    Load a seeded Quantum Mechanics notebook
                  </h2>
                  <p className="mt-1 max-w-xl text-sm text-gray-400">
                    One click creates a Physics subject, a master QM notes page,
                    revision notes, and the concept graph base under your own ID.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleSeed}
                  disabled={seedBusy}
                  className="label-meta cursor-pointer rounded-md bg-[#E9C468] px-4 py-2.5 text-xs text-black transition-colors hover:bg-[#F0D284] disabled:cursor-wait disabled:opacity-60"
                >
                  {seedBusy ? 'Loading QM…' : 'Load QM Demo →'}
                </button>
              </div>
              {seedError && (
                <p className="mt-3 text-sm text-red-300">{seedError}</p>
              )}
            </motion.div>

          {/* Notebook Capture Interface */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <NotebookCapture subjectId={subjectId} />
          </motion.div>
        </div>
      </div>
      </div>
    </AuthGate>
  );
}
