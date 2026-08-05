"use client";

import { motion } from "framer-motion";
import { useMemo, useState } from "react";

import { RegionCard } from "@/components/brain/RegionCard";
import { cn } from "@/lib/utils";
import type { BrainModule } from "@/server/brain";

type BrainHomeProps = {
  modules: BrainModule[];
};

type Slot = { left: number; top: number };

const CORE = { x: 50, y: 50 };

const CARD_W = 20;
const CARD_H = 15;
const MARGIN_X = CARD_W / 2 + 1.5;
const MARGIN_Y = CARD_H / 2 + 1.5;
const CORE_CLEAR = 20;
const MIN_DIST = Math.hypot(CARD_W, CARD_H) * 0.72;

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

function layoutModules(
  modules: BrainModule[]
): { module: BrainModule; slot: Slot }[] {
  const n = modules.length;
  if (n === 0) return [];

  const angleStep = (Math.PI * 2) / n;
  const baseRadius = clamp(
    MIN_DIST / (2 * Math.sin(Math.PI / Math.max(n, 2))),
    CORE_CLEAR + 2,
    38
  );

  const placed: Slot[] = [];

  for (let i = 0; i < n; i++) {
    const entry = modules[i];
    const seed = hashKey(entry.key);
    const angleJitter = (((seed % 11) - 5) / 5) * (angleStep * 0.22);
    const radiusJitter = ((seed % 7) - 3) * 1.4;
    const angle = -Math.PI / 2 + i * angleStep + angleJitter;
    const radius = clamp(baseRadius + radiusJitter, CORE_CLEAR + 1, 40);

    let left = CORE.x + Math.cos(angle) * radius;
    let top = CORE.y + Math.sin(angle) * radius * 1.05;

    for (let attempt = 0; attempt < 24; attempt++) {
      let moved = false;

      const fromCore = Math.hypot(left - CORE.x, top - CORE.y);
      if (fromCore < CORE_CLEAR) {
        const ux = (left - CORE.x) / (fromCore || 1);
        const uy = (top - CORE.y) / (fromCore || 1);
        left = CORE.x + ux * CORE_CLEAR;
        top = CORE.y + uy * CORE_CLEAR;
        moved = true;
      }

      for (const other of placed) {
        const dx = left - other.left;
        const dy = top - other.top;
        const dist = Math.hypot(dx, dy);
        if (dist < MIN_DIST) {
          const ux = dx / (dist || 1);
          const uy = dy / (dist || 1);
          const push = (MIN_DIST - dist) / 2 + 0.6;
          left += ux * push;
          top += uy * push;
          moved = true;
        }
      }

      left = clamp(left, MARGIN_X, 100 - MARGIN_X);
      top = clamp(top, MARGIN_Y, 100 - MARGIN_Y);

      if (!moved) break;
    }

    placed.push({ left, top });
  }

  return modules.map((module, i) => ({
    module,
    slot: placed[i],
  }));
}

export function BrainHome({ modules }: BrainHomeProps) {
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const slots = useMemo(() => layoutModules(modules), [modules]);

  return (
    <div className="relative z-10 flex h-full min-h-0 flex-1 flex-col">
      <div className="space-y-4 md:hidden">
        <div className="grid gap-5 sm:grid-cols-2">
          {modules.map((module, index) => (
            <motion.div
              key={module.key}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                delay: index * 0.06,
                type: "spring",
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

      <div className="relative hidden min-h-0 flex-1 overflow-hidden md:block">
        {slots.map(({ module, slot }, index) => {
          const focused = activeKey === module.key;
          const dimmed = activeKey !== null && !focused;

          return (
            <div
              key={module.key}
              className="absolute z-10 w-[min(260px,20%)] -translate-x-1/2 -translate-y-1/2"
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
                  type: "spring",
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
                    "transition-[filter] duration-200",
                    focused &&
                      "drop-shadow-[0_0_18px_rgba(250,204,20,0.22)]"
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
