'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 48;
const frameUrl = (i: number) =>
  `/frames/ezgif-frame-${String(i + 1).padStart(3, '0')}.png`;

export default function ScrollSequence() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [missing, setMissing] = useState(0);

  useEffect(() => {
    let killed = false;
    let trigger: ScrollTrigger | undefined;
    const state = { frame: 0 };
    const frames: HTMLImageElement[] = [];
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rendered = -1;
    const drawCover = (img: HTMLImageElement) => {
      const cw = canvas.width;
      const ch = canvas.height;
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      if (!iw || !ih) return;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale;
      const dh = ih * scale;
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - dw) / 2, (ch - dh) / 2, dw, dh);
    };
    const render = (f: number) => {
      const i = Math.max(0, Math.min(frames.length - 1, Math.round(f)));
      if (i === rendered || !frames[i]) return;
      rendered = i;
      drawCover(frames[i]);
    };
    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const wrap = canvas.parentElement;
      if (!wrap) return;
      canvas.width = Math.round(wrap.clientWidth * dpr);
      canvas.height = Math.round(wrap.clientHeight * dpr);
    };

    const onLoad = () => {
      sizeCanvas();
      rendered = -1;
      render(state.frame);
    };
    window.addEventListener('resize', onLoad);

    (async () => {
      let loadedCount = 0;
      let failed = 0;
      const results = await Promise.all(
        Array.from({ length: FRAME_COUNT }, (_, i) =>
          new Promise<{ ok: boolean; img: HTMLImageElement | null }>(
            (resolve) => {
              const img = new Image();
              img.decoding = 'async';
              img.onload = () => resolve({ ok: true, img });
              img.onerror = () => resolve({ ok: false, img: null });
              img.src = frameUrl(i);
            },
          ).then((r) => {
            loadedCount++;
            if (!r.ok) failed++;
            setProgress(Math.round((loadedCount / FRAME_COUNT) * 100));
            return r;
          }),
        ),
      );
      if (killed) return;
      results.forEach((r) => r.ok && r.img && frames.push(r.img));
      setMissing(failed);

      await Promise.allSettled(
        frames.slice(0, 2).map((f) => f.decode?.()),
      );

      sizeCanvas();
      rendered = -1;
      render(0);
      setReady(true);

      trigger = ScrollTrigger.create({
        trigger: sectionRef.current,
        start: 'top top',
        end: () => `+=${window.innerHeight * 4}`,
        pin: true,
        anticipatePin: 1,
        scrub: 0.8,
        invalidateOnRefresh: true,
        onUpdate: () => render(state.frame),
      });

      gsap.to(state, {
        frame: Math.max(0, frames.length - 1),
        ease: 'none',
        scrollTrigger: trigger,
      });
    })();

    return () => {
      killed = true;
      window.removeEventListener('resize', onLoad);
      trigger?.kill();
    };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="relative h-screen overflow-hidden bg-black"
    >
      <div className="absolute inset-0 flex items-center justify-center">
        <canvas ref={canvasRef} className="block h-full w-full" />
      </div>

      <div className="pointer-events-none absolute bottom-[6vh] left-[6vw] z-[3]">
        <span className="label-meta text-gray-500">02 · Connect</span>
        <h2 className="font-display mt-2 text-xl text-white sm:text-3xl">
          Every page, remembered.
        </h2>
      </div>

      {!ready && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3.5 bg-black transition-opacity duration-700">
          <span className="label-meta text-gray-400">
            The well remembers · {progress}%
          </span>
          <div className="h-px w-60 overflow-hidden bg-white/[0.12]">
            <div
              className="h-full bg-[#5FD6C4] transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {ready && missing > 0 && (
        <p className="label-meta absolute right-[6vw] top-6 z-[3] text-[#E9C468]/80">
          {FRAME_COUNT - missing}/{FRAME_COUNT} frames
        </p>
      )}
    </section>
  );
}
