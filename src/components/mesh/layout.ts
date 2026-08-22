import type { MeshPayload } from '../../lib/types';

type Vec3 = [number, number, number];

const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

function hashJitter(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (((h >>> 0) % 1000) / 1000 - 0.5) * 0.9;
}

export function computeLayout(payload: MeshPayload): Map<string, Vec3> {
  const nodes = [...payload.nodes].sort((a, b) => b.size - a.size);
  const n = nodes.length;
  const result = new Map<string, Vec3>();

  if (n === 0) return result;

  const radius = Math.min(15, Math.max(6, 3.1 * Math.sqrt(n)));

  nodes.forEach((node, i) => {
    if (n === 1) {
      result.set(node.id, [0, 0, 0]);
      return;
    }
    const theta = GOLDEN_ANGLE * i + hashJitter(node.id);
    const r = radius * Math.sqrt((i + 0.5) / n);
    const x = r * Math.cos(theta);
    const z = r * Math.sin(theta);
    const t = r / radius;
    const y = 2.4 * (1 - t * t);
    result.set(node.id, [x, y, z]);
  });

  return result;
}
