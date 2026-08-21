import type { MeshPayload } from '../../lib/types';

type Vec3 = [number, number, number];

function initialPosition(index: number, total: number): Vec3 {
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));
  const y = total <= 1 ? 0 : 1 - (2 * index) / (total - 1);
  const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
  const theta = goldenAngle * index;
  return [
    10 * radiusAtY * Math.cos(theta),
    10 * y,
    10 * radiusAtY * Math.sin(theta),
  ];
}

export function computeLayout(payload: MeshPayload): Map<string, Vec3> {
  const nodeCount = payload.nodes.length;
  const positions: Vec3[] = payload.nodes.map((_, i) =>
    initialPosition(i, nodeCount),
  );
  const velocities: Vec3[] = payload.nodes.map(() => [0, 0, 0]);
  const forces: Vec3[] = payload.nodes.map(() => [0, 0, 0]);

  const indexOf = new Map<string, number>();
  payload.nodes.forEach((node, i) => {
    indexOf.set(node.id, i);
  });

  const k = 40;
  const damping = 0.85;
  const dt = 0.02;
  const restBase = 2;

  for (let iter = 0; iter < 150; iter++) {
    for (const force of forces) {
      force[0] = 0;
      force[1] = 0;
      force[2] = 0;
    }

    for (let i = 0; i < nodeCount; i++) {
      for (let j = i + 1; j < nodeCount; j++) {
        const pa = positions[i];
        const pb = positions[j];
        let dx = pa[0] - pb[0];
        let dy = pa[1] - pb[1];
        let dz = pa[2] - pb[2];
        let dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
        if (dist < 0.5) dist = 0.5;
        const magnitude = k / (dist * dist);
        dx /= dist;
        dy /= dist;
        dz /= dist;
        const fa = forces[i];
        const fb = forces[j];
        fa[0] += dx * magnitude;
        fa[1] += dy * magnitude;
        fa[2] += dz * magnitude;
        fb[0] -= dx * magnitude;
        fb[1] -= dy * magnitude;
        fb[2] -= dz * magnitude;
      }
    }

    for (const edge of payload.edges) {
      const si = indexOf.get(edge.source);
      const ti = indexOf.get(edge.target);
      if (si === undefined || ti === undefined) continue;
      const rest = restBase + 8 * (1 - edge.weight);
      const pa = positions[si];
      const pb = positions[ti];
      let dx = pb[0] - pa[0];
      let dy = pb[1] - pa[1];
      let dz = pb[2] - pa[2];
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz) || 0.0001;
      const magnitude = ((dist - rest) / dist) * 0.5;
      dx *= magnitude;
      dy *= magnitude;
      dz *= magnitude;
      const fs = forces[si];
      const ft = forces[ti];
      fs[0] += dx;
      fs[1] += dy;
      fs[2] += dz;
      ft[0] -= dx;
      ft[1] -= dy;
      ft[2] -= dz;
    }

    for (let i = 0; i < nodeCount; i++) {
      const pos = positions[i];
      const force = forces[i];
      force[0] -= pos[0] * 0.01;
      force[1] -= pos[1] * 0.01;
      force[2] -= pos[2] * 0.01;

      const velocity = velocities[i];
      velocity[0] = (velocity[0] + force[0] * dt) * damping;
      velocity[1] = (velocity[1] + force[1] * dt) * damping;
      velocity[2] = (velocity[2] + force[2] * dt) * damping;

      pos[0] += velocity[0] * dt;
      pos[1] += velocity[1] * dt;
      pos[2] += velocity[2] * dt;
    }
  }

  const result = new Map<string, Vec3>();
  payload.nodes.forEach((node, i) => {
    result.set(node.id, positions[i]);
  });
  return result;
}
