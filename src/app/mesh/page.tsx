'use client';

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '@/convex/_generated/api';
import Navbar from '@/components/Navbar';
import MeshCanvas from '@/components/mesh/MeshCanvas';
import { DEMO_MESH } from '@/lib/demoMesh';
import type { MeshNode } from '@/lib/types';

export default function MeshPage() {
  const [selected, setSelected] = useState<MeshNode | null>(null);
  const payload = useQuery(api.concepts.meshPayload, {
    ownerId: 'demo-user',
  });

  const active =
    payload && payload.nodes.length > 0 ? payload : null;
  const usingDemo = !payload || payload.nodes.length === 0;

  const legend = [
    ...new Map(
      (active?.nodes ?? DEMO_MESH.nodes).map((n) => [n.color, n.label]),
    ).entries(),
  ];

  return (
    <div className="relative min-h-screen overflow-hidden bg-black text-white">
      <Navbar />
      <div
        className="pointer-events-none absolute inset-0 z-10 opacity-5"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%235FD6C4' fill-opacity='0.1'%3E%3Ctext x='10' y='30' font-size='8' fill='%235FD6C4'%3E01%3C/text%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      <div className="relative z-20 pt-20">
        <div className="mr-auto ml-0 max-w-5xl px-6 sm:px-10 lg:px-20">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="mb-4 inline-flex items-center gap-2.5 rounded-md border border-white/[0.08] px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#5FD6C4]" />
              <span className="label-meta text-gray-400">02 · Connect</span>
            </div>
            <h1 className="font-display mb-2 text-3xl sm:text-5xl">
              Concept <span className="text-gray-400">Mesh</span>
            </h1>
            <p className="max-w-xl text-sm leading-relaxed text-gray-500">
              Topics as nodes. Threads of similarity between them — every
              revision you ever wrote, woven in.
            </p>
          </motion.div>
        </div>

        <div className="relative h-[calc(100vh-12rem)] w-full">
          {payload === undefined ? (
            <div className="flex h-full items-center justify-center">
              <p className="animate-pulse text-sm text-gray-400">
                Indexing your notes…
              </p>
            </div>
          ) : (
            <>
              {usingDemo && (
                <div className="absolute top-3 left-1/2 z-30 -translate-x-1/2 rounded-md border border-white/[0.08] bg-black/70 px-4 py-1.5 label-meta text-gray-400">
                  Demo data — upload notebook pages to populate your mesh
                </div>
              )}
              <MeshCanvas
                payload={active ?? DEMO_MESH}
                onNodeClick={setSelected}
              />
              <div className="absolute bottom-4 left-4 z-30 flex flex-wrap gap-2">
                {legend.map(([color, label]) => (
                  <span
                    key={color}
                    className="flex items-center gap-1.5 rounded-md bg-black/60 px-2.5 py-1 text-[10px] text-gray-300"
                  >
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: color }}
                    />
                    {label}
                  </span>
                ))}
              </div>
            </>
          )}

          {selected && (
            <motion.aside
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              className="absolute top-1/4 right-4 z-30 w-72 rounded-lg border border-white/[0.08] bg-black/80 p-4 backdrop-blur"
            >
              <button
                type="button" onClick={() => setSelected(null)}
                className="absolute top-2 right-3 text-gray-500 hover:text-white"
                aria-label="Close"
              >
                ×
              </button>
              <h3 className="pr-4 text-lg font-semibold">{selected.label}</h3>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-md bg-[#5FD6C4]/10 px-2 py-0.5 text-[10px] tracking-wide text-[#5FD6C4] uppercase">
                  {selected.kind}
                </span>
                <span className="text-xs text-gray-400">
                  {selected.size} pages linked
                </span>
              </div>
              <button
                type="button"
                disabled
                className="mt-4 w-full cursor-not-allowed rounded-md border border-white/[0.08] px-3 py-2 text-sm text-gray-500"
              >
                Drill-in view coming soon
              </button>
            </motion.aside>
          )}
        </div>
      </div>
    </div>
  );
}
