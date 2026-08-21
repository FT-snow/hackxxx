'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

const LINKS = [
  { href: '/', label: 'Home' },
  { href: '/notebook', label: 'Notes' },
  { href: '/mesh', label: 'Mesh' },
  { href: '/paper-checker', label: 'Grader' },
  { href: '/profile', label: 'Profile' },
  {
    href: 'https://github.com/FT-snow/hackxxx',
    label: 'Source',
    external: true,
  },
];

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { isAuthenticated } = useConvexAuth();
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <nav className="fixed top-0 z-50 w-full border-b border-white/[0.08] bg-black/90 backdrop-blur-md">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="flex items-center gap-2.5"
          >
            <Link
              href="/"
              className="font-display flex items-center gap-2 text-lg tracking-[0.18em] text-white hover:text-[#E9C468]"
            >
              <span className="text-[#E9C468]">ᛗ</span> MIMIR
            </Link>
          </motion.div>

          <div className="hidden items-center gap-8 lg:flex">
            {LINKS.map((l) => (
              <Link
                key={l.label}
                href={l.href}
                {...('external' in l && l.external
                  ? { target: '_blank', rel: 'noreferrer' }
                  : {})}
                className="label-meta text-gray-400 hover:text-white"
              >
                {l.label}
              </Link>
            ))}
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              className="label-meta cursor-pointer rounded-md border border-white/[0.14] bg-transparent px-4 py-2 text-white hover:border-white/30"
              onClick={() => {
                window.location.href = isAuthenticated ? '/notebook' : '/login';
              }}
            >
              {isAuthenticated ? 'Notes' : 'Sign in'}
            </motion.button>
            {isAuthenticated && (
              <motion.button
                whileTap={{ scale: 0.98 }}
                type="button"
                className="label-meta cursor-pointer rounded-md bg-[#E9C468] px-4 py-2 text-black hover:bg-[#F0D284]"
                onClick={async () => {
                  await signOut();
                  router.push('/');
                }}
              >
                Sign out
              </motion.button>
            )}
          </div>

          <button
            className="p-1 text-white lg:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            type="button"
            aria-label="Toggle menu"
          >
            <motion.svg
              animate={{ rotate: isMenuOpen ? 90 : 0 }}
              transition={{ duration: 0.2 }}
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d={
                  isMenuOpen
                    ? 'M6 18L18 6M6 6l12 12'
                    : 'M4 6h16M4 12h16M4 18h16'
                }
              />
            </motion.svg>
          </button>
        </div>

        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25 }}
            className="border-t border-white/[0.08] py-4 lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  {...('external' in l && l.external
                    ? { target: '_blank', rel: 'noreferrer' }
                    : {})}
                  className="label-meta rounded-md px-3 py-2.5 text-gray-300 hover:bg-white/5 hover:text-white"
                  onClick={() => setIsMenuOpen(false)}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </div>
    </nav>
  );
}
