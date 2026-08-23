'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import NavHeader from '@/components/ui/nav-header';

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
    <nav className="pointer-events-none fixed top-0 z-50 w-full">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="relative flex h-16 items-center justify-between">
          <div />

          <div className="pointer-events-auto absolute top-1/2 left-1/2 hidden -translate-x-1/2 -translate-y-1/2 lg:block">
            <NavHeader />
          </div>

          <div className="pointer-events-auto z-10 hidden items-center gap-3 lg:flex">
            <motion.button
              whileTap={{ scale: 0.98 }}
              type="button"
              className="cursor-pointer rounded-md border border-[#E9C468]/40 bg-[#E9C468]/10 px-4 py-2 text-xs font-bold tracking-wider text-[#E9C468] uppercase transition-colors duration-200 hover:border-[#E9C468]/70 hover:bg-[#E9C468]/20"
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
                className="cursor-pointer rounded-md bg-[#E9C468] px-4 py-2 text-xs font-bold tracking-wider text-black uppercase hover:bg-[#F0D284]"
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
            className="pointer-events-auto p-1 text-white lg:hidden"
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
            className="pointer-events-auto mt-2 rounded-lg border border-white/[0.1] bg-[#0c0f0d] py-3 lg:hidden"
          >
            <div className="flex flex-col gap-1">
              {LINKS.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  {...('external' in l && l.external
                    ? { target: '_blank', rel: 'noreferrer' }
                    : {})}
                  className="rounded-md px-3 py-2.5 text-sm font-bold tracking-wide text-gray-300 uppercase hover:bg-white/5 hover:text-white"
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
