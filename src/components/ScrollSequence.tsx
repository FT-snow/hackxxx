'use client';

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useEffect, useRef, useState } from 'react';

gsap.registerPlugin(ScrollTrigger);

const FRAME_COUNT = 48;
const frameUrl = (i: number) =>
  `/frames/ezgif-frame-${String(i + 1).padStart(3, '0')}.png`;

const ASCII_RAMP = ' .:-=+*#%@ᚠᚱᛗ';
const RUNE_COUNT = 3;
const CELL_CSS_PX = 11;
const ASCII_CACHE_MAX = 40;
const INK = '#f2f2ec';
const RUNE_INK = '#7de8d8';

interface ScrollSequenceProps {
  children?: React.ReactNode;
}

export default function ScrollSequence({ children }: ScrollSequenceProps) {
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
    let curDpr = 1;

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

    const srcCanvas = document.createElement('canvas');
    const srcCtx = srcCanvas.getContext('2d');
    const sampleCanvas = document.createElement('canvas');
    const sampleCtx = sampleCanvas.getContext('2d', { willReadFrequently: true });
    const asciiCache = new Map<number, HTMLCanvasElement>();

    const paintCover = (
      g: CanvasRenderingContext2D,
      w: number,
      h: number,
      img: HTMLImageElement,
    ): boolean => {
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      if (!iw || !ih || !w || !h) return false;
      const scale = Math.max(w / iw, h / ih);
      g.clearRect(0, 0, w, h);
      g.drawImage(img, (w - iw * scale) / 2, (h - ih * scale) / 2, iw * scale, ih * scale);
      return true;
    };

    const buildAscii = (i: number): HTMLCanvasElement | null => {
      if (!srcCtx || !sampleCtx) return null;
      const cw = canvas.width;
      const chh = canvas.height;
      const img = frames[i];
      if (!cw || !chh || !img) return null;
      if (!paintCover(srcCtx, cw, chh, img)) return null;

      const cellW = Math.max(4, Math.round(CELL_CSS_PX * curDpr));
      const cellH = cellW * 2;
      const cols = Math.max(1, Math.round(cw / cellW));
      const rows = Math.max(1, Math.round(chh / cellH));

      if (sampleCanvas.width !== cols || sampleCanvas.height !== rows) {
        sampleCanvas.width = cols;
        sampleCanvas.height = rows;
      }
      sampleCtx.imageSmoothingEnabled = true;
      sampleCtx.imageSmoothingQuality = 'medium';
      sampleCtx.clearRect(0, 0, cols, rows);
      sampleCtx.drawImage(srcCanvas, 0, 0, cols, rows);

      const data = sampleCtx.getImageData(0, 0, cols, rows).data;
      const out = document.createElement('canvas');
      out.width = cw;
      out.height = chh;
      const octx = out.getContext('2d');
      if (!octx) return null;

      octx.fillStyle = '#000000';
      octx.fillRect(0, 0, cw, chh);
      octx.textAlign = 'center';
      octx.textBaseline = 'middle';
      octx.font = `${Math.floor(cellW * 1.55)}px ui-monospace, Menlo, Consolas, monospace`;

      const maxIdx = ASCII_RAMP.length - 1;
      const runeStart = maxIdx - RUNE_COUNT + 1;

      for (let pass = 0; pass < 2; pass++) {
        octx.fillStyle = pass === 0 ? INK : RUNE_INK;
        for (let y = 0; y < rows; y++) {
          const gy = y * cellH + cellH * 0.5;
          for (let x = 0; x < cols; x++) {
            const p = (y * cols + x) * 4;
            const lum =
              0.2126 * data[p] + 0.7152 * data[p + 1] + 0.0722 * data[p + 2];
            const norm = Math.min(1, (lum / 255) ** 0.75 * 1.25);
            const idx = Math.min(maxIdx, Math.round(norm * maxIdx));
            if (pass === 0 ? idx >= runeStart : idx < runeStart) continue;
            const glyph = ASCII_RAMP[idx];
            if (glyph === ' ') continue;
            octx.fillText(glyph, x * cellW + cellW * 0.5, gy);
          }
        }
      }
      return out;
    };

    const getAscii = (i: number): HTMLCanvasElement | null => {
      const hit = asciiCache.get(i);
      if (hit) return hit;
      const built = buildAscii(i);
      if (!built) return null;
      asciiCache.set(i, built);
      while (asciiCache.size > ASCII_CACHE_MAX) {
        let farKey = -1;
        let farDist = -1;
        for (const k of asciiCache.keys()) {
          const d = Math.abs(k - i);
          if (d > farDist) {
            farDist = d;
            farKey = k;
          }
        }
        if (farKey === i || farKey < 0) break;
        asciiCache.delete(farKey);
      }
      return built;
    };

    let rawWarned = false;
    const renderRaw = (i: number, why?: string) => {
      if (!rawWarned && why) {
        console.warn(`[ScrollSequence] ASCII off: ${why}`);
        rawWarned = true;
      }
      const img = frames[i];
      if (img) paintCover(ctx, canvas.width, canvas.height, img);
    };

    const render = (f: number) => {
      if (frames.length === 0) return;
      const i = Math.max(0, Math.min(frames.length - 1, Math.round(f)));
      if (i === rendered || !frames[i]) return;
      rendered = i;
      if (reducedMotion.matches) {
        renderRaw(i, 'prefers-reduced-motion is enabled');
        return;
      }
      const ascii = getAscii(i);
      if (!ascii) {
        renderRaw(i, 'ASCII build failed');
        return;
      }
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(ascii, 0, 0);
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
      curDpr = dpr;
      asciiCache.clear();
      rendered = -1;
    };
    const onResize = () => {
      sizeCanvas();
      render(state.current);
    };
    window.addEventListener('resize', onResize);

    const onMotionChange = () => {
      rendered = -1;
      render(state.current);
    };
    reducedMotion.addEventListener('change', onMotionChange);

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
      reducedMotion.removeEventListener('change', onMotionChange);
      st?.kill();
    };
  }, []);

  return (
    <section ref={wrapRef} className="relative h-[400vh]">
      <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden bg-black">
        <div className="absolute inset-0 flex items-center justify-center">
          <canvas ref={canvasRef} className="block h-full w-full" />
        </div>

        <div className="pointer-events-none absolute inset-0 z-[2] bg-gradient-to-r from-black/80 via-black/30 to-transparent" />
        <div className="absolute inset-0 z-[3] flex items-center">
          <div className="w-full max-w-5xl px-6 sm:px-10 lg:px-20">{children}</div>
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
