'use client';

import { useAuthActions } from '@convex-dev/auth/react';
import { useConvexAuth } from 'convex/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Navbar from '@/components/Navbar';

export default function LoginPage() {
  const { signIn } = useAuthActions();
  const { isAuthenticated } = useConvexAuth();
  const router = useRouter();
  const [flow, setFlow] = useState<'signIn' | 'signUp'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      await signIn(flow === 'signUp' ? 'signUp' : 'signIn', {
        provider: 'password',
        email,
        password,
        name: email.split('@')[0],
      });
      router.push('/notebook');
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message.replace(/^Uncaught Error: /, '')
          : 'Something went wrong',
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <Navbar />
      <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-6 pt-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="rounded-lg border border-white/[0.08] bg-black p-7"
        >
          <span className="label-meta text-[#C8A45C]">
            {flow === 'signUp' ? 'New scribe' : 'Welcome back'}
          </span>
          <h1 className="font-display mt-3 text-2xl text-white">
            {flow === 'signUp' ? 'Claim your well' : 'Enter the well'}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            One account. Every subject, every page, every concept thread —
            kept separately and remembered together.
          </p>

          {isAuthenticated && (
            <p className="label-meta mt-6 rounded-md border border-white/[0.08] bg-[#0c0f0d] px-4 py-3 text-gray-300">
              Already signed in.
            </p>
          )}

          <form onSubmit={submit} className="mt-7 space-y-4">
            <div>
              <label htmlFor="email" className="label-meta mb-2 block text-gray-500">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@gmail.com"
                className="w-full rounded-md border border-white/[0.08] bg-[#0c0f0d] px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 focus:border-[#E9C468]/40 focus:outline-none"
              />
            </div>
            <div>
              <label htmlFor="password" className="label-meta mb-2 block text-gray-500">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="min. 8 characters"
                className="w-full rounded-md border border-white/[0.08] bg-[#0c0f0d] px-4 py-3 text-sm text-gray-200 placeholder:text-gray-600 focus:border-[#E9C468]/40 focus:outline-none"
              />
            </div>

            {error && (
              <p className="text-sm text-red-300">{error}</p>
            )}

            <button
              type="submit"
              disabled={busy}
              className={`label-meta w-full rounded-md py-3.5 text-xs transition-colors ${
                busy
                  ? 'cursor-wait bg-[#0c0f0d] text-gray-500'
                  : 'cursor-pointer bg-[#E9C468] text-black hover:bg-[#F0D284]'
              }`}
            >
              {busy
                ? '…'
                : flow === 'signUp'
                  ? 'Create account'
                  : 'Sign in'}
            </button>
          </form>

          <button
            type="button"
            onClick={() => {
              setFlow(flow === 'signUp' ? 'signIn' : 'signUp');
              setError(null);
            }}
            className="label-meta mt-5 w-full cursor-pointer text-center text-gray-500 hover:text-white"
          >
            {flow === 'signUp'
              ? 'Have an account? Sign in'
              : 'New here? Create an account'}
          </button>
        </motion.div>
      </div>
    </div>
  );
}
