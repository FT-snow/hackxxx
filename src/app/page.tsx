'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Squares from '@/components/ui/SquareBg';
import { BentoCard, BentoGrid } from '@/components/ui/Bento';

const STEPS = [
  {
    n: '01',
    title: 'Capture',
    body: 'Photograph any notebook page. Handwriting, derivations, diagrams — transcribed with structure and LaTeX intact.',
    href: '/notebook',
    cta: 'Upload pages',
  },
  {
    n: '02',
    title: 'Connect',
    body: 'Pages are chunked, tagged, and embedded. Notes on the same topic link across days into concept threads.',
    href: '/mesh',
    cta: 'Open the mesh',
  },
  {
    n: '03',
    title: 'Recall',
    body: 'Browse the concept mesh or test yourself — practice questions generated from your own linked notes.',
    href: '/paper-checker',
    cta: 'Test me',
  },
];

export default function Home() {
  return (
    <div className="h-full overflow-x-hidden text-white">
      <Navbar />
      <div className="absolute z-[-10] h-full w-full">
        <Squares
          speed={0.4}
          squareSize={48}
          direction="diagonal"
          borderColor="#12281c"
          hoverFillColor="#1a1a1a"
        />
      </div>

      <section className="relative flex min-h-screen items-center pt-16">
        <div className="relative z-20 mr-auto ml-0 w-full max-w-5xl px-6 sm:px-10 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-10 inline-flex items-center gap-2.5 rounded-md border border-white/[0.08] px-3 py-1.5"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-[#5FD6C4]" />
            <span className="label-meta text-gray-400">
              Handwritten notes · The well of memory
            </span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.08 }}
            className="font-display mb-8 max-w-4xl text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-7xl xl:text-[5.25rem]"
          >
            Your notebook,
            <br />
            <span className="text-gray-400">finally</span> remembered.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.16 }}
            className="mb-12 max-w-xl text-base leading-relaxed text-gray-400 sm:text-lg"
          >
            Mimir reads your handwritten engineering notes, tags every
            derivation and diagram, and links what you wrote weeks apart into
            one searchable concept mesh.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="mb-24 flex flex-col gap-3 sm:flex-row sm:gap-4"
          >
            <button
              type="button"
              onClick={() => {
                window.location.href = '/notebook';
              }}
              className="label-meta rounded-md bg-white px-7 py-3.5 text-black hover:bg-gray-200 active:scale-[0.98] sm:w-auto"
            >
              Digitize my notes
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/mesh';
              }}
              className="label-meta rounded-md border border-white/[0.14] px-7 py-3.5 text-white hover:border-white/30 active:scale-[0.98] sm:w-auto"
            >
              Explore the mesh
            </button>
          </motion.div>

          <BentoGrid>
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.55,
                  delay: 0.35 + i * 0.09,
                }}
              >
                <BentoCard n={s.n} title={s.title} className="min-h-[13rem]">
                  {s.body}
                  <a
                    href={s.href}
                    className="label-meta mt-6 inline-block text-gray-500 group-hover:text-[#5FD6C4]"
                  >
                    {s.cta} →
                  </a>
                </BentoCard>
              </motion.div>
            ))}
          </BentoGrid>
        </div>
      </section>
    </div>
  );
}
