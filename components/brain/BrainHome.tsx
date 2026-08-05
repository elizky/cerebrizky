"use client";

import { motion } from "framer-motion";

import { RegionCard } from "@/components/brain/RegionCard";
import { copy } from "@/lib/copy";
import { REGION_META } from "@/lib/validations/item";
import type { BrainRegion } from "@/server/brain";

type BrainHomeProps = {
  regions: BrainRegion[];
  inboxCount: number;
  totalCount: number;
};

export function BrainHome({ regions, inboxCount, totalCount }: BrainHomeProps) {
  return (
    <div className="space-y-8">
      <motion.header
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="space-y-3"
      >
        <p className="text-eyebrow">{copy.app.tagline}</p>
        <h1 className="text-5xl leading-none md:text-6xl">{copy.app.name}</h1>
        <p className="max-w-xl text-sm text-muted-foreground">
          {totalCount === 0 ? copy.brain.empty : copy.brain.populated}
        </p>
      </motion.header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <RegionCard
          href={REGION_META.IDEA.href}
          layoutId="region-inbox"
          label={REGION_META.IDEA.label}
          description={REGION_META.IDEA.description}
          count={inboxCount}
          accent={REGION_META.IDEA.accent}
          always
        />
        {regions.map((region) => (
          <RegionCard
            key={region.type}
            href={region.href}
            layoutId={`region-${region.type.toLowerCase()}`}
            label={region.label}
            description={region.description}
            count={region.count}
            accent={REGION_META[region.type].accent}
          />
        ))}
        <RegionCard
          href="/search"
          layoutId="region-search"
          label={copy.brain.searchLabel}
          description={copy.brain.searchDescription}
          count={totalCount}
          accent="from-muted to-accent/40"
          always
        />
      </div>
    </div>
  );
}
