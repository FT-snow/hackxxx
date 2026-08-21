'use client';

import { ConvexAuthProvider } from '@convex-dev/auth/react';
import { ConvexProvider, ConvexReactClient } from 'convex/react';
import type { ReactNode } from 'react';

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  throw new Error('Missing NEXT_PUBLIC_CONVEX_URL environment variable');
}

const convex = new ConvexReactClient(convexUrl);

export default function ConvexClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ConvexProvider client={convex}>
      <ConvexAuthProvider client={convex}>{children}</ConvexAuthProvider>
    </ConvexProvider>
  );
}
