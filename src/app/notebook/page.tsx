'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import Navbar from '@/components/Navbar';
import NotebookCapture from '@/components/NotebookCapture';
import SubjectPicker from '@/components/SubjectPicker';
import type { Id } from '@/convex/_generated/dataModel';

export default function NotebookPage() {
  const [subjectId, setSubjectId] = useState<Id<'subjects'> | null>(null);
  return (
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
  );
}
