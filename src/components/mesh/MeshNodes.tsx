'use client';

import { Html } from '@react-three/drei';
import { useFrame, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import type { MeshNode, MeshPayload } from '@/lib/types';
import { computeLayout } from './layout';

const VERTEX = /* glsl */ `
uniform float uTime;
uniform float uPixelRatio;
attribute float aSize;
attribute vec3 aColor;
attribute float aHighlight;
varying vec3 vColor;
varying float vHighlight;
void main() {
  vColor = aColor;
  vHighlight = aHighlight;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  float pulse = 1.0 + 0.08 * sin(uTime * 2.0 + position.x);
  gl_PointSize = aSize * uPixelRatio * (140.0 / -mv.z) * pulse;
  gl_Position = projectionMatrix * mv;
}
`;

const FRAGMENT = /* glsl */ `
varying vec3 vColor;
varying float vHighlight;
void main() {
  float d = length(gl_PointCoord - vec2(0.5));
  if (d > 0.5) discard;
  float core = smoothstep(0.5, 0.32, d);
  float glow = smoothstep(0.5, 0.42, d) * 0.6;
  vec3 col = mix(vColor, vec3(1.0), vHighlight * 0.7);
  float alpha = max(core, glow);
  gl_FragColor = vec4(col + glow * 0.3, alpha);
}
`;

export default function MeshNodes({
  payload,
  onNodeClick,
}: {
  payload: MeshPayload;
  onNodeClick?: (n: MeshNode) => void;
}) {
  const [hovered, setHovered] = useState<MeshNode | null>(null);
  const pointsRef = useRef<THREE.Points>(null);
  const matRef = useRef<THREE.ShaderMaterial>(null);
  const { gl } = useThree();

  const layout = useMemo(() => computeLayout(payload), [payload]);

  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(payload.nodes.length * 3);
    const sizes = new Float32Array(payload.nodes.length);
    const colors = new Float32Array(payload.nodes.length * 3);
    const highlights = new Float32Array(payload.nodes.length);
    payload.nodes.forEach((n, i) => {
      const p = layout.get(n.id) ?? [0, 0, 0];
      positions.set(p, i * 3);
      sizes[i] = n.size * 2.2;
      const c = new THREE.Color(n.color);
      colors.set([c.r, c.g, c.b], i * 3);
    });
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1));
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3));
    geo.setAttribute('aHighlight', new THREE.BufferAttribute(highlights, 1));
    return geo;
  }, [payload, layout]);

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          uTime: { value: 0 },
          uPixelRatio: { value: Math.min(gl.getPixelRatio(), 2) },
        },
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [gl],
  );

  useEffect(() => () => material.dispose(), [material]);
  useEffect(() => () => geometry.dispose(), [geometry]);

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.uniforms.uTime.value = clock.getElapsedTime();
    }
  });

  const setHighlight = useCallback(
    (id: string | null, value: number) => {
      const idx = payload.nodes.findIndex((n) => n.id === id);
      if (idx === -1 || !pointsRef.current) return;
      const attr = pointsRef.current.geometry.getAttribute(
        'aHighlight',
      ) as THREE.BufferAttribute;
      attr.setX(idx, value);
      attr.needsUpdate = true;
    },
    [payload.nodes],
  );

  const handleOver = useCallback(
    (id: string) => {
      setHighlight(id, 1);
      setHovered(payload.nodes.find((n) => n.id === id) ?? null);
    },
    [payload.nodes, setHighlight],
  );

  const handleOut = useCallback(
    (id: string) => {
      setHighlight(id, 0);
      setHovered(null);
    },
    [setHighlight],
  );

  return (
    <group>
      <points ref={pointsRef} geometry={geometry} material={material} />
      {payload.nodes.map((n) => {
        const p = layout.get(n.id) ?? [0, 0, 0];
        return (
          // biome-ignore lint/a11y/noStaticElementInteractions: react-three-fiber 3D object, not DOM
          <mesh
            key={n.id}
            position={p as [number, number, number]}
            visible={false}
            onPointerOver={(e) => {
              e.stopPropagation();
              handleOver(n.id);
            }}
            onPointerOut={() => handleOut(n.id)}
            onClick={(e) => {
              e.stopPropagation();
              onNodeClick?.(n);
            }}
          >
            <sphereGeometry args={[Math.max(n.size * 0.55, 0.8), 8, 8]} />
            <meshBasicMaterial />
          </mesh>
        );
      })}
      {hovered &&
        (() => {
          const p = layout.get(hovered.id) ?? [0, 0, 0];
          return (
            <Html
              position={p as [number, number, number]}
              center
              distanceFactor={14}
            >
              <div className="pointer-events-none rounded-lg border border-[#E9C468]/40 bg-black/85 px-3 py-1.5 text-center whitespace-nowrap">
                <div className="text-sm font-medium text-white">
                  {hovered.label}
                </div>
                <div className="text-[10px] tracking-wide text-[#E9C468] uppercase">
                  {hovered.kind} · {hovered.size} pages
                </div>
              </div>
            </Html>
          );
        })()}
    </group>
  );
}
