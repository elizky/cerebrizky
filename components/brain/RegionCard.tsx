"use client";

import Link from "next/link";
import { motion } from "framer-motion";

import { Badge } from "@/components/ui/badge";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

type RegionCardProps = {
  href: string;
  layoutId: string;
  label: string;
  description: string;
  count: number;
  accent?: string;
  always?: boolean;
};

export function RegionCard({
  href,
  layoutId,
  label,
  description,
  count,
  accent = "from-primary/30 to-accent/40",
  always,
}: RegionCardProps) {
  return (
    <Link href={href} className="block h-full">
      <motion.article
        layoutId={layoutId}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: "spring", stiffness: 320, damping: 28 }}
        className={cn(
          "flex h-full min-h-[160px] flex-col justify-between rounded-lg border border-border bg-gradient-to-br p-5 shadow-md",
          accent
        )}
      >
        <div>
          <div className="flex items-center justify-between gap-3">
            <h2>{label}</h2>
            <Badge variant="secondary">{count}</Badge>
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{description}</p>
        </div>
        <p className="text-eyebrow">
          {always ? copy.brain.alwaysOpen : copy.brain.enterRegion}
        </p>
      </motion.article>
    </Link>
  );
}
