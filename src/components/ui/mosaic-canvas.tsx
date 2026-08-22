'use client';

import { useEffect, useRef } from 'react';

// ---------------------------------------------------------------------------
// "Custom ASCII art" (21st.dev) recipe parameters — mosaic render mode
// ---------------------------------------------------------------------------
const PARAMS = {
  renderMode: 'mosaic',
  bgMode: 'solid',
  bgColor: '#000000',
  cellSize: 13,
  coverage: 100,
  invert: false,
  brightness: 12, // percent
  contrast: 115, // percent
  saturation: 100,
  grayscale: 0,
  tint: '#3ca6ff',
  tintOpacity: 0,
  pfx: {
    vignette: { enabled: true, intensity: 38 },
    chromatic: { enabled: true, intensity: 15 },
    bloom: { enabled: true, intensity: 25 },
  },
  animated: true,
  animStyle: 'ripple',
  animSpeedIntensity: 100,
  animIntensity: 68,
  // normalized points (x/y vs canvas); radius relative to max dimension
  lights: {
    enabled: true,
    points: [{ x: 0.16, y: 0.1, radius: 0.38, intensity: 0.9 }],
  },
} as const;

const SRC = '/mimir.png';
const DPR_CAP = 1.75;
const FPS_CAP = 1000 / 33; // ~30fps is plenty for an ambient wash

interface MosaicCanvasProps {
  className?: string;
}

export default function MosaicCanvas({ className }: MosaicCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let killed = false;
    let raf = 0;
    let lastFrame = 0;
    let t0 = performance.now();

    // Persistent scratch buffers for the chromatic post-effect.
    const snapA = document.createElement('canvas');
    const snapActx = snapA.getContext('2d');
    const snapB = document.createElement('canvas');
    const snapBctx = snapB.getContext('2d');

    // One-time per-resize sample of the photo's grid cells.
    let cols = 0;
    let rows = 0;
    let cell = PARAMS.cellSize;
    let samples: Uint8ClampedArray | null = null;

    const img = new Image();
    img.decoding = 'async';
    img.src = SRC;

    const contrastLut = (() => {
      const c = PARAMS.contrast / 100;
      // brightness is a signed percent offset: 12 -> x1.12
      const b = 1 + PARAMS.brightness / 100;
      const lut = new Uint8ClampedArray(256);
      for (let i = 0; i < 256; i++) {
        let v = i / 255;
        v = (v - 0.5) * c + 0.5; // contrast around mid
        v *= b; // brightness
        lut[i] = Math.round(Math.max(0, Math.min(1, v)) * 255);
      }
      return lut;
    })();

    const sizeAndSample = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, DPR_CAP);
      const parent = canvas.parentElement;
      if (!parent) return;
      const w = parent.clientWidth;
      const h = parent.clientHeight;
      if (!w || !h) return;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      cell = PARAMS.cellSize * dpr;
      cols = Math.ceil(canvas.width / cell);
      rows = Math.ceil(canvas.height / cell);

      // Draw the photo cover-fit into a cols x rows buffer so each pixel IS
      // one cell's average color.
      const s = document.createElement('canvas');
      s.width = cols;
      s.height = rows;
      const sctx = s.getContext('2d', { willReadFrequently: true });
      if (!sctx || !img.naturalWidth) return;
      const scale = Math.max(cols / img.naturalWidth, rows / img.naturalHeight);
      const iw = img.naturalWidth * scale;
      const ih = img.naturalHeight * scale;
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = 'medium';
      sctx.drawImage(img, (cols - iw) / 2, (rows - ih) / 2, iw, ih);
      samples = sctx.getImageData(0, 0, cols, rows).data;
      t0 = performance.now();
    };

    const draw = (now: number) => {
      raf = 0;
      if (killed || !samples) return;
      const W = canvas.width;
      const H = canvas.height;

      // Layer 1: solid background behind the effect (bgMode: solid).
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = PARAMS.bgColor;
      ctx.fillRect(0, 0, W, H);

      // Layer 2: the animated mosaic.
      const time = (now - t0) / 1000;
      const speed = 0.9 * (PARAMS.animSpeedIntensity / 100);
      const amp = PARAMS.animIntensity / 100; // wave depth
      const coverage = PARAMS.coverage / 100;

      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          if ((x * 7 + y * 13) % 97 > coverage * 97 + 1) continue;
          const p = (y * cols + x) * 4;
          // animation styles: ripple rings from top-right, wave = diagonal sweep
          const phase =
            PARAMS.animStyle === 'ripple'
              ? Math.hypot(x - (cols - 1), y) * 0.55 - time * speed * 2.4
              : (x + y) * 0.32 + time * speed * 2.4;
          const wave = Math.sin(phase);
          // lights: proximity boost so sunlit cells stay bright
          let lightBoost = 0;
          if (PARAMS.lights.enabled) {
            for (const pt of PARAMS.lights.points) {
              const d = Math.hypot(x - pt.x * cols, y - pt.y * rows);
              const rr = Math.max(1, pt.radius * Math.max(cols, rows));
              if (d < rr) lightBoost += pt.intensity * (1 - d / rr);
            }
          }
          const lumBoost = (1 + amp * 0.55 * wave) * (1 + lightBoost);
          const inset = amp * 1.5 * (1 - wave) * 0.5; // cells breathe

          const r = contrastLut[samples[p]] * lumBoost;
          const g = contrastLut[samples[p + 1]] * lumBoost;
          const bl = contrastLut[samples[p + 2]] * lumBoost;

          ctx.fillStyle = `rgb(${r | 0},${g | 0},${bl | 0})`;
          ctx.fillRect(
            x * cell + inset,
            y * cell + inset,
            cell - inset * 2 + 0.5,
            cell - inset * 2 + 0.5,
          );
        }
      }

      // Layer 3: post effects — chromatic aberration via channel split.
      // snapA holds the pre-effect frame; red and cyan layers are both built
      // from it, then recombined additively with opposite offsets.
      if (
        (PARAMS.pfx.chromatic.enabled || PARAMS.pfx.bloom.enabled) &&
        snapActx &&
        snapBctx &&
        (snapA.width !== W || snapA.height !== H)
      ) {
        snapA.width = W;
        snapA.height = H;
        snapB.width = W;
        snapB.height = H;
      }
      if (PARAMS.pfx.chromatic.enabled && snapActx && snapBctx) {
        const d = Math.max(1, (PARAMS.pfx.chromatic.intensity / 100) * 5);
        snapActx.clearRect(0, 0, W, H);
        snapActx.drawImage(canvas, 0, 0);

        snapBctx.clearRect(0, 0, W, H);
        snapBctx.globalCompositeOperation = 'source-over';
        snapBctx.drawImage(snapA, 0, 0);
        snapBctx.globalCompositeOperation = 'multiply';
        snapBctx.fillStyle = '#00ffff';
        snapBctx.fillRect(0, 0, W, H);
        ctx.clearRect(0, 0, W, H);
        ctx.drawImage(snapB, -d, 0);

        snapBctx.clearRect(0, 0, W, H);
        snapBctx.globalCompositeOperation = 'source-over';
        snapBctx.drawImage(snapA, 0, 0);
        snapBctx.globalCompositeOperation = 'multiply';
        snapBctx.fillStyle = '#ff0000';
        snapBctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'lighter';
        ctx.drawImage(snapB, d, 0);
        ctx.globalCompositeOperation = 'source-over';
      }

      // Layer 3b: bloom — blurred additive copy of the composed frame.
      if (PARAMS.pfx.bloom.enabled && snapActx && snapBctx) {
        snapActx.clearRect(0, 0, W, H);
        snapActx.drawImage(canvas, 0, 0);
        snapBctx.clearRect(0, 0, W, H);
        snapBctx.globalCompositeOperation = 'source-over';
        snapBctx.filter = `blur(${Math.max(6, Math.round(W / 90))}px)`;
        snapBctx.drawImage(snapA, 0, 0);
        snapBctx.filter = 'none';
        ctx.globalCompositeOperation = 'lighter';
        ctx.globalAlpha = Math.min(
          0.85,
          (PARAMS.pfx.bloom.intensity / 100) * 1.1,
        );
        ctx.drawImage(snapB, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
      }

      // Layer 3c: lights — warm additive glow at each configured point.
      if (PARAMS.lights.enabled && PARAMS.lights.points.length > 0) {
        ctx.globalCompositeOperation = 'lighter';
        for (const pt of PARAMS.lights.points) {
          const cx = pt.x * W;
          const cy = pt.y * H;
          const rr = pt.radius * Math.max(W, H) * 0.55;
          const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rr);
          g.addColorStop(
            0,
            `rgba(255,241,209,${(pt.intensity * 0.5).toFixed(3)})`,
          );
          g.addColorStop(1, 'rgba(255,241,209,0)');
          ctx.fillStyle = g;
          ctx.fillRect(cx - rr, cy - rr, rr * 2, rr * 2);
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      // Layer 4: vignette.
      if (PARAMS.pfx.vignette.enabled) {
        const g = ctx.createRadialGradient(
          W / 2,
          H / 2,
          Math.min(W, H) * 0.35,
          W / 2,
          H / 2,
          Math.max(W, H) * 0.72,
        );
        const a = (PARAMS.pfx.vignette.intensity / 100) * 0.85;
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, `rgba(0,0,0,${a})`);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, W, H);
      }
    };

    const loop = (now: number) => {
      if (killed) return;
      if (now - lastFrame >= FPS_CAP) {
        lastFrame = now;
        draw(now);
      }
      raf = requestAnimationFrame(loop);
    };

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const startLoop = () => {
      cancelAnimationFrame(raf);
      if (reduced.matches) {
        draw(performance.now()); // single static frame
      } else {
        raf = requestAnimationFrame(loop);
      }
    };

    const onReady = () => {
      if (killed) return;
      sizeAndSample();
      startLoop();
    };
    if (img.complete && img.naturalWidth) onReady();
    else img.onload = onReady;

    let resizeTimer = 0;
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        sizeAndSample();
        draw(performance.now());
      }, 150);
    };
    window.addEventListener('resize', onResize);
    reduced.addEventListener('change', startLoop);

    return () => {
      killed = true;
      cancelAnimationFrame(raf);
      window.clearTimeout(resizeTimer);
      window.removeEventListener('resize', onResize);
      reduced.removeEventListener('change', startLoop);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
      tabIndex={-1}
    />
  );
}
