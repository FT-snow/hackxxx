'use client';

import { motion } from 'framer-motion';
import Navbar from '@/components/Navbar';
import { BentoCard, BentoGrid } from '@/components/ui/Bento';
import MosaicCanvas from '@/components/ui/mosaic-canvas';
import Squares from '@/components/ui/SquareBg';

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

const FEATURES = [
  {
    rune: 'ᚠ',
    title: 'It reads your scrawl better than you do',
    body: 'Chaotic handwriting in, surgical precision out. Derivations rebuilt as clean LaTeX, headings reconstructed, every numbered question accounted for.',
  },
  {
    rune: 'ᚱ',
    title: 'Every line, filed in milliseconds',
    body: 'Your page detonates into tagged chunks — question, derivation, definition, diagram — each one labeled with its concept before you even blink.',
  },
  {
    rune: 'ᛗ',
    title: 'It remembers what you forgot you wrote',
    body: 'Week-old derivations and this morning\u2019s revision find each other on their own. Mimir links them across time by meaning, not keywords.',
  },
  {
    rune: 'ᚦ',
    title: 'Your syllabus as a living constellation',
    body: 'Every topic you have ever touched, hanging in a 3D mesh of clusters and threads. Grab a node. Everything it touches lights up.',
  },
  {
    rune: 'ᚨ',
    title: 'An examiner built from your own notes',
    body: 'grAIder interrogates you with questions mined from your pages, then grades your handwritten answers with partial credit — coldly, fairly, instantly.',
  },
  {
    rune: 'ᛁ',
    title: 'Chaos to cheat sheet in seconds',
    body: 'The moment a page is digitized, Mimir distills it into a TL;DR, key points, formulas and recall questions. Revision material you never had to write.',
  },
];

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

      <section className="relative flex h-screen items-center overflow-hidden">
        <MosaicCanvas className="absolute inset-0 h-full w-full" />
        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-black/90 via-black/50 to-black/15" />
        <div className="absolute inset-x-0 bottom-0 z-[2] h-40 bg-gradient-to-t from-black to-transparent" />

        <div className="relative z-[3] w-full max-w-5xl px-6 sm:px-10 lg:px-20">
          <motion.h1
            initial={{ opacity: 0, y: 24, filter: 'blur(16px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-display mb-4 text-[4.5rem] leading-none sm:text-[7rem] lg:text-[9rem] xl:text-[11rem]"
          >
            Mimir
          </motion.h1>

          <motion.h2
            initial="hidden"
            animate="show"
            transition={{ staggerChildren: 0.07, delayChildren: 0.15 }}
            className="font-display mb-8 max-w-3xl text-xl leading-snug sm:text-2xl lg:text-3xl"
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
          </motion.h2>

          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.24 }}
            className="flex w-full max-w-md flex-col gap-4 sm:flex-row sm:gap-5"
          >
            <button
              type="button"
              onClick={() => {
                window.location.href = '/notebook';
              }}
              className="group flex-1 cursor-pointer rounded-lg bg-black/25 px-6 py-7 text-left backdrop-blur-xl transition-colors duration-300 hover:bg-black/50"
            >
              <span className="label-meta text-[#C8A45C]">01</span>
              <span className="font-display mt-1 block text-sm text-white">
                Digitize my notes
              </span>
              <span className="label-meta mt-2 inline-block text-gray-500 transition-colors group-hover:text-[#E9C468]">
                Start →
              </span>
            </button>
            <button
              type="button"
              onClick={() => {
                window.location.href = '/mesh';
              }}
              className="group flex-1 cursor-pointer rounded-lg bg-black/25 px-6 py-7 text-left backdrop-blur-xl transition-colors duration-300 hover:bg-black/50"
            >
              <span className="label-meta text-[#C8A45C]">02</span>
              <span className="font-display mt-1 block text-sm text-white">
                Explore the mesh
              </span>
              <span className="label-meta mt-2 inline-block text-gray-500 transition-colors group-hover:text-[#E9C468]">
                Open →
              </span>
            </button>
          </motion.div>
        </div>
      </section>

      <section className="relative flex min-h-screen items-center pt-24 pb-20">
        <div className="relative z-20 mx-auto w-full max-w-5xl px-6 sm:px-10 lg:px-20">
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

          <div className="mt-24">
            <span className="label-meta text-[#C8A45C]">What Mimir does</span>
            <h2 className="font-display mt-3 mb-8 text-2xl sm:text-3xl">
              Six weapons against{' '}
              <span className="text-gray-400">forgetting</span>
            </h2>
            <BentoGrid cols={3}>
              {FEATURES.map((f) => (
                <motion.div
                  key={f.title}
                  {...reveal}
                  transition={{ duration: 0.5 }}
                >
                  <div className="flex h-full flex-col bg-black p-6">
                    <span className="mb-3 text-lg text-[#E9C468]">
                      {f.rune}
                    </span>
                    <h3 className="font-display text-base text-white">
                      {f.title}
                    </h3>
                    <p className="mt-2 text-sm leading-relaxed text-gray-500">
                      {f.body}
                    </p>
                  </div>
                </motion.div>
              ))}
            </BentoGrid>
          </div>
        </div>
      </section>
    </div>
  );
}
