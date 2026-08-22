'use client';

import { OrbitControls, Sparkles } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing';
import { Suspense, useEffect, useRef, type ComponentRef } from 'react';
import type { MeshNode, MeshPayload } from '@/lib/types';
import { MeshEdges } from './MeshEdges';
import MeshNodes from './MeshNodes';

type ControlsRef = ComponentRef<typeof OrbitControls>;

export default function MeshScene({
  payload,
  onNodeClick,
}: {
  payload: MeshPayload;
  onNodeClick?: (n: MeshNode) => void;
}) {
  const controlsRef = useRef<ControlsRef>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')
      ) {
        return;
      }
      if (e.code === 'Space') {
        e.preventDefault();
        const controls = controlsRef.current;
        if (controls) {
          controls.autoRotate = !controls.autoRotate;
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Canvas dpr={[1, 2]} camera={{ fov: 55, position: [0, 4, 18] }}>
      <color attach="background" args={['#000000']} />
      <Suspense fallback={null}>
        <MeshNodes payload={payload} onNodeClick={onNodeClick} />
        <MeshEdges payload={payload} />
        <Sparkles
          count={120}
          scale={30}
          size={2}
          speed={0.3}
          opacity={0.4}
          color="#E9C468"
        />
      </Suspense>
      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.08}
        autoRotate
        autoRotateSpeed={1.5}
      />
      <EffectComposer>
        <Bloom intensity={0.6} luminanceThreshold={0.2} mipmapBlur />
        <Vignette darkness={0.85} eskil={false} />
      </EffectComposer>
    </Canvas>
  );
}
