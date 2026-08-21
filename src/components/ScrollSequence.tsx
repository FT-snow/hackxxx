'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 48;
const frameUrl = (i: number) =>
  `/frames/ezgif-frame-${String(i + 1).padStart(3, '0')}.png`;

export default function ScrollSequence() {
  const wrapRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [missing, setMissing] = useState(0);

  useEffect(() => {
    let killed = false;
    let st: ScrollTrigger | undefined;
    let raf = 0;
    const frames: HTMLImageElement[] = [];
    const state = { current: 0, target: 0 };
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
      ctx.clearRect(0, 0, cw, ch);
      ctx.drawImage(img, (cw - iw * scale) / 2, (ch - ih * scale) / 2, iw * scale, ih * scale);
    };
    const render = (f: number) => {
      if (frames.length === 0) return;
      const i = Math.max(0, Math.min(frames.length - 1, Math.round(f)));
      if (i === rendered || !frames[i]) return;
      rendered = i;
      drawCover(frames[i]);
    };
    const tick = () => {
      state.current += (state.target - state.current) * 0.14;
      if (Math.abs(state.target - state.current) < 0.002) state.current = state.target;
      render(state.current);
      raf = requestAnimationFrame(tick);
    };

    const sizeCanvas = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const wrap = canvas.parentElement;
      if (!wrap) return;
      canvas.width = Math.round(wrap.clientWidth * dpr);
      canvas.height = Math.round(wrap.clientHeight * dpr);
      rendered = -1;
    };
    const onResize = () => {
      sizeCanvas();
      render(state.current);
    };
    window.addEventListener('resize', onResize);

    (async () => {
      let loadedCount = 0;
      let failed = 0;
      const results = await Promise.all(
        Array.from({ length: FRAME_COUNT }, (_, i) =>
          new Promise<{ ok: boolean; img: HTMLImageElement | null }>((resolve) => {
            const img = new Image();
            img.decoding = 'async';
            img.onload = () => resolve({ ok: true, img });
            img.onerror = () => resolve({ ok: false, img: null });
            img.src = frameUrl(i);
          }).then((r) => {
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

      await Promise.allSettled(frames.slice(0, 2).map((f) => f.decode?.()));

      sizeCanvas();
      render(0);
      setReady(true);

      st = ScrollTrigger.create({
        trigger: wrapRef.current,
        start: 'top top',
        end: 'bottom bottom',
        onUpdate: (self) => {
          state.target = self.progress * Math.max(0, frames.length - 1);
        },
      });

      raf = requestAnimationFrame(tick);
    })();

    return () => {
      killed = true;
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', onResize);
      st?.kill();
    };
  }, []);

  return (
    <section ref={wrapRef} className="relative h-[400vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-black">
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
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3.5 bg-black">
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
      </div>
    </section>
  );
}
