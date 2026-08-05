'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

import { cn } from '@/lib/utils';

export type BrainBand = {
  key: string;
  weight: number;
};

type PointN = { x: number; y: number };

/** Normalized Bézier recipes — edge-to-edge, dispersed (Waves composition). */
const LAYOUTS: { start: PointN; cp1: PointN; cp2: PointN; end: PointN }[] = [
  {
    start: { x: -0.04, y: 0.65 },
    cp1: { x: 0.3, y: 0.6 },
    cp2: { x: 0.7, y: 0.4 },
    end: { x: 1.04, y: 0.2 },
  },
  {
    start: { x: 0.28, y: -0.05 },
    cp1: { x: 0.4, y: 0.22 },
    cp2: { x: 0.58, y: 0.12 },
    end: { x: 0.72, y: -0.05 },
  },
  {
    start: { x: -0.05, y: 0.18 },
    cp1: { x: 0.16, y: 0.48 },
    cp2: { x: 0.24, y: 0.82 },
    end: { x: 0.38, y: 1.05 },
  },
  {
    start: { x: 0.42, y: 1.05 },
    cp1: { x: 0.58, y: 0.72 },
    cp2: { x: 0.86, y: 0.52 },
    end: { x: 1.05, y: 0.42 },
  },
  {
    start: { x: -0.05, y: 0.42 },
    cp1: { x: 0.22, y: 0.28 },
    cp2: { x: 0.55, y: 0.78 },
    end: { x: 1.05, y: 0.68 },
  },
  {
    start: { x: 0.12, y: 1.05 },
    cp1: { x: 0.35, y: 0.55 },
    cp2: { x: 0.7, y: 0.25 },
    end: { x: 1.05, y: 0.12 },
  },
  {
    start: { x: 0.55, y: -0.05 },
    cp1: { x: 0.72, y: 0.35 },
    cp2: { x: 0.88, y: 0.7 },
    end: { x: 0.95, y: 1.05 },
  },
  {
    start: { x: -0.05, y: 0.88 },
    cp1: { x: 0.35, y: 0.92 },
    cp2: { x: 0.65, y: 0.08 },
    end: { x: 1.05, y: 0.35 },
  },
  {
    start: { x: 0.08, y: -0.04 },
    cp1: { x: 0.25, y: 0.4 },
    cp2: { x: 0.5, y: 0.85 },
    end: { x: 0.9, y: 1.05 },
  },
  {
    start: { x: 1.05, y: 0.75 },
    cp1: { x: 0.7, y: 0.9 },
    cp2: { x: 0.35, y: 0.15 },
    end: { x: -0.04, y: 0.3 },
  },
];

type Strand = {
  key: string;
  layoutIndex: number;
  angle: number;
  weight: number;
};

type BrainBackgroundProps = {
  className?: string;
  bands: BrainBand[];
  lineColor?: string;
  bgColor1?: string;
  bgColor2?: string;
};

function hashKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function lineWidthFor(weight: number, maxWeight: number) {
  const t = Math.sqrt(Math.max(weight, 0) / Math.max(maxWeight, 1));
  return 0.7 + t * 3.2;
}

function alphaFor(weight: number, maxWeight: number) {
  const t = Math.sqrt(Math.max(weight, 0) / Math.max(maxWeight, 1));
  return 0.16 + t * 0.42;
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function assignLayouts(bands: BrainBand[]): Strand[] {
  const used = new Set<number>();
  const n = LAYOUTS.length;

  return bands.map((band) => {
    let index = hashKey(band.key) % n;
    let guard = 0;
    while (used.has(index) && guard < n) {
      index = (index + 1) % n;
      guard += 1;
    }
    used.add(index);
    return {
      key: band.key,
      layoutIndex: index,
      angle: (hashKey(band.key) % 1000) / 100,
      weight: band.weight,
    };
  });
}

export function BrainBackground({
  className,
  bands,
  lineColor = '#8A7418',
  bgColor1 = '#1a1a1a',
  bgColor2 = '#222018',
}: BrainBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const bandsRef = useRef(bands);
  const strandsRef = useRef<Strand[]>([]);

  useEffect(() => {
    bandsRef.current = bands;
  }, [bands]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    let animationFrameId = 0;
    let width = 0;
    let height = 0;
    let keysSignature = '';

    function syncStrands() {
      const current = bandsRef.current;
      const nextKeys = current.map((b) => b.key).join('|');
      if (nextKeys !== keysSignature || strandsRef.current.length === 0) {
        keysSignature = nextKeys;
        strandsRef.current = assignLayouts(current);
      } else {
        const byKey = new Map(current.map((b) => [b.key, b.weight]));
        for (const strand of strandsRef.current) {
          strand.weight = byKey.get(strand.key) ?? 0;
        }
      }
    }

    function resize() {
      width = container!.offsetWidth;
      height = container!.offsetHeight;
      if (width <= 0 || height <= 0) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas!.width = Math.max(1, Math.floor(width * dpr));
      canvas!.height = Math.max(1, Math.floor(height * dpr));
      canvas!.style.width = `${width}px`;
      canvas!.style.height = `${height}px`;
      ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
      syncStrands();
    }

    function draw() {
      syncStrands();
      ctx!.clearRect(0, 0, width, height);

      const strands = strandsRef.current;
      const maxWeight = Math.max(...strands.map((s) => s.weight), 1);

      for (const strand of strands) {
        const layout = LAYOUTS[strand.layoutIndex];
        strand.angle += 0.005;

        const swayX1 = Math.sin(strand.angle) * 25;
        const swayY1 = Math.cos(strand.angle) * 20;
        const swayX2 = Math.cos(strand.angle * 0.8) * 20;
        const swayY2 = Math.sin(strand.angle * 1.2) * 25;

        const alpha = alphaFor(strand.weight, maxWeight);
        const widthPx = lineWidthFor(strand.weight, maxWeight);

        ctx!.beginPath();
        ctx!.moveTo(layout.start.x * width, layout.start.y * height);
        ctx!.bezierCurveTo(
          layout.cp1.x * width + swayX1,
          layout.cp1.y * height + swayY1,
          layout.cp2.x * width + swayX2,
          layout.cp2.y * height + swayY2,
          layout.end.x * width,
          layout.end.y * height,
        );
        ctx!.strokeStyle = hexToRgba(lineColor, alpha);
        ctx!.lineWidth = widthPx;
        ctx!.lineCap = 'round';
        ctx!.shadowBlur = widthPx > 2 ? 8 : 3;
        ctx!.shadowColor = hexToRgba(lineColor, Math.min(0.45, alpha + 0.08));
        ctx!.stroke();
      }

      ctx!.shadowBlur = 0;
      animationFrameId = requestAnimationFrame(draw);
    }

    const resizeObserver = new ResizeObserver(() => resize());
    resizeObserver.observe(container);
    resize();
    animationFrameId = requestAnimationFrame(draw);

    return () => {
      resizeObserver.disconnect();
      cancelAnimationFrame(animationFrameId);
    };
  }, [lineColor]);

  return (
    <div
      ref={containerRef}
      aria-hidden
      className={cn('pointer-events-none absolute inset-0 overflow-hidden', className)}
      style={{
        background: `linear-gradient(145deg, ${bgColor1} 0%, ${bgColor2} 55%, #1c1810 100%)`,
      }}
    >
      <motion.div
        animate={{
          opacity: [0.12, 0.2, 0.12],
          scale: [1, 1.04, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className='absolute bottom-[-30%] right-[-20%] h-[120%] w-full rounded-full blur-[130px]'
        style={{
          background: 'radial-gradient(circle, rgba(138, 116, 24, 0.22) 0%, transparent 75%)',
        }}
      />
      <canvas ref={canvasRef} className='absolute inset-0 block h-full w-full' />
    </div>
  );
}
