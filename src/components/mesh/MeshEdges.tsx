'use client';

import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import type { MeshPayload } from '@/lib/types';
import { computeLayout } from './layout';

const STRONG = { color: '#5FD6C4', opacity: 0.55 };
const WEAK = { color: '#5FD6C4', opacity: 0.18 };

export function MeshEdges({ payload }: { payload: MeshPayload }) {
  const layout = useMemo(() => computeLayout(payload), [payload]);

  const strong = useMemo(
    () => buildSegments(payload, layout, 0.75),
    [payload, layout],
  );
  const weak = useMemo(
    () => buildSegments(payload, layout, -1, 0.75),
    [payload, layout],
  );

  useEffect(
    () => () => {
      strong.geometry.dispose();
      weak.geometry.dispose();
    },
    [strong, weak],
  );

  return (
    <group>
      <lineSegments geometry={weak.geometry}>
        <lineBasicMaterial
          color={WEAK.color}
          transparent
          opacity={WEAK.opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
      <lineSegments geometry={strong.geometry}>
        <lineBasicMaterial
          color={STRONG.color}
          transparent
          opacity={STRONG.opacity}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </lineSegments>
    </group>
  );
}

function buildSegments(
  payload: MeshPayload,
  layout: Map<string, [number, number, number]>,
  minWeight: number,
  maxWeight = Infinity,
) {
  const pts: number[] = [];
  const pos = new Map(payload.nodes.map((n) => [n.id, layout.get(n.id)]));
  for (const e of payload.edges) {
    if (e.weight < minWeight || e.weight > maxWeight) continue;
    const a = pos.get(e.source);
    const b = pos.get(e.target);
    if (!a || !b) continue;
    pts.push(...a, ...b);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    'position',
    new THREE.Float32BufferAttribute(pts, 3),
  );
  return { geometry: geo };
}
