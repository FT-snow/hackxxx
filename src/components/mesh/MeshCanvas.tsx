'use client';

import dynamic from 'next/dynamic';
import type { MeshNode, MeshPayload } from '@/lib/types';

const MeshScene = dynamic(() => import('./MeshScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center">
      <p className="animate-pulse text-sm text-gray-500">Loading mesh…</p>
    </div>
  ),
});

export default function MeshCanvas({
  payload,
  onNodeClick,
}: {
  payload: MeshPayload;
  onNodeClick?: (n: MeshNode) => void;
}) {
  return (
    <div className="h-full w-full">
      <MeshScene payload={payload} onNodeClick={onNodeClick} />
    </div>
  );
}
