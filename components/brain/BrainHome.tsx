'use client';

import { motion } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';

import { RegionCard } from '@/components/brain/RegionCard';
import { cn } from '@/lib/utils';
import type { BrainModule } from '@/server/brain';

type BrainHomeProps = {
  modules: BrainModule[];
};

type Slot = { left: number; top: number };

type LayoutMetrics = {
  marginX: number;
  marginY: number;
  minDist: number;
  coreClear: number;
  spreadX: number;
  spreadY: number;
};

type CanvasSize = { width: number; height: number };

const CORE = { x: 50, y: 50 };
/** Below this canvas width, use a fixed staggered lattice (no overlaps). */
const TABLET_MAX_WIDTH = 1180;

function hashKey(key: string): number {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function metricsFromSize(width: number, height: number): LayoutMetrics {
  const cardWpx = width >= 1280 ? 240 : 200;
  const cardHpx = Math.min(cardWpx * 0.75, height * 0.3);
  const cardW = (cardWpx / Math.max(width, 1)) * 100;
  const cardH = (cardHpx / Math.max(height, 1)) * 100;

  return {
    marginX: cardW / 2 + 1.25,
    marginY: cardH / 2 + 1.5,
    minDist: Math.hypot(cardW, cardH) * 0.62,
    coreClear: clamp(10 + (6 - Math.min(width, 1400) / 200), 8, 14),
    spreadX: width < 1400 ? 0.9 : 0.94,
    spreadY: height < 700 ? 0.72 : height < 900 ? 0.78 : 0.84,
  };
}

/** Staggered 2-column lattice — organic but collision-free on tablet. */
function layoutTablet(
  modules: BrainModule[],
  height: number,
): { module: BrainModule; slot: Slot }[] {
  const n = modules.length;
  if (n === 0) return [];

  const compact = height < 680;
  const cols = 2;
  const rows = Math.ceil(n / cols);
  const topStart = compact ? 16 : 18;
  const topEnd = compact ? 84 : 82;
  const rowGap = rows <= 1 ? 0 : (topEnd - topStart) / (rows - 1);

  return modules.map((module, i) => {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const seed = hashKey(module.key);
    // Odd rows shift so columns don't form a rigid grid
    const rowShift = row % 2 === 1 ? 4 : 0;
    const jitterX = (((seed - 1) % 6) - 2) * 1.2;
    const jitterY = ((((seed >> 7) % 3) - 1) / 2) * 1.4;

    const leftBase = col === 0 ? 27 + rowShift : 73 - rowShift;
    const topBase = topStart + row * rowGap;

    // Lone last item on odd count: center it on its row
    const isLone = i === n - 1 && n % cols === 1;
    const left = isLone ? 50 + jitterX * 0.3 : leftBase + jitterX;
    const top = topBase + jitterY;

    return {
      module,
      slot: {
        left: clamp(left, 22, 78),
        top: clamp(top, 14, 86),
      },
    };
  });
}

function layoutDesktop(
  modules: BrainModule[],
  metrics: LayoutMetrics,
): { module: BrainModule; slot: Slot }[] {
  const n = modules.length;
  if (n === 0) return [];

  const { marginX, marginY, minDist, coreClear, spreadX, spreadY } = metrics;
  const angleStep = (Math.PI * 2) / n;
  const packRadius = minDist / (2 * Math.sin(Math.PI / Math.max(n, 2)));
  const maxRadiusX = Math.max(coreClear + 2, 50 - marginX);
  const maxRadiusY = Math.max(coreClear + 2, 50 - marginY);
  const baseRadiusX = clamp(
    Math.max(packRadius * 1.2, maxRadiusX * spreadX),
    coreClear + 2,
    maxRadiusX,
  );
  const baseRadiusY = clamp(
    Math.max(packRadius * 1.05, maxRadiusY * spreadY),
    coreClear + 2,
    maxRadiusY,
  );

  const placed: Slot[] = [];

  for (let i = 0; i < n; i++) {
    const entry = modules[i];
    const seed = hashKey(entry.key);
    const angleJitter = (((seed % 11) - 5) / 5) * (angleStep * 0.16);
    const radiusJitterX = ((seed % 7) - 3) * 0.9;
    const radiusJitterY = (((seed >> 3) % 7) - 3) * 0.7;
    const angle = -Math.PI / 2 + i * angleStep + angleJitter;
    const radiusX = clamp(baseRadiusX + radiusJitterX, coreClear + 1, maxRadiusX);
    const radiusY = clamp(baseRadiusY + radiusJitterY, coreClear + 1, maxRadiusY);

    let left = CORE.x + Math.cos(angle) * radiusX;
    let top = CORE.y + Math.sin(angle) * radiusY;

    for (let attempt = 0; attempt < 32; attempt++) {
      let moved = false;

      const fromCore = Math.hypot((left - CORE.x) / 1.25, top - CORE.y);
      if (fromCore < coreClear) {
        const ux = (left - CORE.x) / (fromCore || 1);
        const uy = (top - CORE.y) / (fromCore || 1);
        left = CORE.x + ux * coreClear * 1.25;
        top = CORE.y + uy * coreClear;
        moved = true;
      }

      for (const other of placed) {
        const dx = left - other.left;
        const dy = top - other.top;
        const dist = Math.hypot(dx, dy);
        if (dist < minDist) {
          const ux = dx / (dist || 1);
          const uy = dy / (dist || 1);
          const push = (minDist - dist) / 2 + 0.4;
          left += ux * push;
          top += uy * push;
          moved = true;
        }
      }

      left = clamp(left, marginX, 100 - marginX);
      top = clamp(top, marginY, 100 - marginY);

      if (!moved) break;
    }

    placed.push({ left, top });
  }

  return modules.map((module, i) => ({
    module,
    slot: placed[i],
  }));
}

function layoutModules(
  modules: BrainModule[],
  size: CanvasSize,
): { module: BrainModule; slot: Slot }[] {
  if (size.width < TABLET_MAX_WIDTH) {
    return layoutTablet(modules, size.height);
  }
  return layoutDesktop(modules, metricsFromSize(size.width, size.height));
}

export function BrainHome({ modules }: BrainHomeProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<CanvasSize>({ width: 1280, height: 800 });

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;

    function measure() {
      const rect = el!.getBoundingClientRect();
      if (rect.width <= 0 || rect.height <= 0) return;
      setSize({ width: rect.width, height: rect.height });
    }

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const slots = useMemo(() => layoutModules(modules, size), [modules, size]);

  return (
    <div className='relative z-10 flex h-full min-h-0 flex-1 flex-col'>
      <div className='space-y-4 md:hidden'>
        <div className='grid gap-5 sm:grid-cols-2'>
          {modules.map((module, index) => (
            <motion.div
              key={module.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.06,
                type: 'spring',
                stiffness: 280,
              }}
            >
              <RegionCard
                href={module.href}
                layoutId={`${module.layoutId}-mobile`}
                label={module.label}
                description={module.description}
                meta={module.meta}
                count={module.count}
                accent={module.accent}
              />
            </motion.div>
          ))}
        </div>
      </div>

      <div ref={canvasRef} className='relative hidden min-h-0 flex-1 overflow-hidden md:block'>
        {slots.map(({ module, slot }, index) => {
          const focused = activeKey === module.key;
          const dimmed = activeKey !== null && !focused;

          return (
            <div
              key={module.key}
              className='absolute z-10 w-3xs lg:w-2xs -translate-x-1/2 -translate-y-1/2'
              style={{ left: `${slot.left}%`, top: `${slot.top}%` }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.97 }}
                animate={{
                  opacity: dimmed ? 0.4 : 1,
                  scale: focused ? 1.03 : 1,
                }}
                transition={{
                  delay: activeKey ? 0 : 0.15 + index * 0.05,
                  type: 'spring',
                  stiffness: 280,
                  damping: 24,
                  opacity: { duration: 0.2 },
                }}
                onHoverStart={() => setActiveKey(module.key)}
                onHoverEnd={() => setActiveKey(null)}
              >
                <RegionCard
                  href={module.href}
                  layoutId={module.layoutId}
                  label={module.label}
                  description={module.description}
                  meta={module.meta}
                  count={module.count}
                  accent={module.accent}
                  className={cn(
                    'transition-[filter] duration-200',
                    focused && 'drop-shadow-[0_0_18px_rgba(250,204,20,0.22)]',
                  )}
                />
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
