'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import Squares from '@/components/ui/SquareBg';
import ScrollSequence from '@/components/ScrollSequence';
import { BentoCard, BentoGrid } from '@/components/ui/Bento';

const HERO_WORDS: Array<[string, boolean]> = [
  ['Your', false],
  ['notebook,', false],
  ['finally', true],
  ['remembered.', false],
];

const MARQUEE =
  'ᚠ ᚢ ᚦ ᚨ ᚱ ᚲ ᚷ ᚹ ᚺ ᚾ ᛁ ᛃ ᛇ ᛈ ᛉ ᛊ ᛏ ᛒ ᛖ ᛗ ᛚ ᛜ ᛞ ᛟ · MIMIR · THE WELL REMEMBERS · ';

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

const reveal = {
  initial: { opacity: 0, y: 40 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: false, amount: 0.4 },
};

export default function Home() {
  return (
    <div className="overflow-x-clip text-white">
      <Navbar />
      <div className="absolute z-[-10] h-full w-full">
        <Squares
          speed={0.4}
          squareSize={48}
          direction="diagonal"
          borderColor="#241d10"
          hoverFillColor="#1a1a1a"
        />
      </div>

      <ScrollSequence>
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 inline-flex items-center gap-2.5 rounded-md border border-white/[0.14] bg-black/40 px-3 py-1.5 backdrop-blur-sm"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-[#E9C468]" />
          <span className="label-meta text-gray-300">
            Handwritten notes · The well of memory
          </span>
        </motion.div>

        <motion.h1
          initial="hidden"
          animate="show"
          transition={{ staggerChildren: 0.07, delayChildren: 0.08 }}
          className="font-display mb-6 max-w-4xl text-[2.75rem] leading-[1.05] sm:text-6xl lg:text-7xl xl:text-[5rem]"
        >
          {HERO_WORDS.map(([word, muted], i) => (
            <motion.span
              key={i}
              variants={{
                hidden: { opacity: 0, y: '0.4em', filter: 'blur(12px)' },
                show: {
                  opacity: 1,
                  y: '0em',
                  filter: 'blur(0px)',
                  transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] },
                },
              }}
              className={`mr-[0.28em] inline-block ${muted ? 'text-gray-400' : ''}`}
            >
              {word}
            </motion.span>
          ))}
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.16 }}
          className="mb-8 max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg"
        >
          Mimir reads your handwritten notes, tags every derivation and diagram,
          and links what you wrote weeks apart into one searchable concept mesh.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.24 }}
          className="flex flex-col gap-3 sm:flex-row sm:gap-4"
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
            className="label-meta rounded-md border border-white/[0.2] bg-black/30 px-7 py-3.5 text-white backdrop-blur-sm hover:border-white/40 active:scale-[0.98] sm:w-auto"
          >
            Explore the mesh
          </button>
        </motion.div>
      </ScrollSequence>

      <section className="relative flex min-h-screen items-center pt-24 pb-20">
        <div className="relative z-20 mr-auto ml-0 w-full max-w-5xl px-6 sm:px-10 lg:px-20">
          <BentoGrid>
            {STEPS.map((s, i) => (
              <motion.div
                key={s.n}
                {...reveal}
                transition={{ duration: 0.6, delay: i * 0.08 }}
              >
                <BentoCard n={s.n} title={s.title} className="min-h-[13rem]">
                  {s.body}
                  <a
                    href={s.href}
                    className="label-meta mt-6 inline-block text-gray-500 group-hover:text-[#E9C468]"
                  >
                    {s.cta} →
                  </a>
                </BentoCard>
              </motion.div>
            ))}
          </BentoGrid>

          <div className="mt-14 overflow-hidden border-t border-white/[0.08] pt-5">
            <div className="rune-marquee-track flex w-max whitespace-nowrap">
              <span className="label-meta pr-8 text-gray-700">
                {MARQUEE.repeat(4)}
              </span>
              <span className="label-meta pr-8 text-gray-700">
                {MARQUEE.repeat(4)}
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
