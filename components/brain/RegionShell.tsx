"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft } from "lucide-react";

import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";

type RegionShellProps = {
  layoutId: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
};

export function RegionShell({
  layoutId,
  title,
  description,
  children,
  actions,
  className,
}: RegionShellProps) {
  return (
    <motion.section
      layoutId={layoutId}
      initial={{ opacity: 0.85, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      className={cn(
        "rounded-lg border border-border bg-card/80 p-6 shadow-lg backdrop-blur-md md:p-8",
        className
      )}
    >
      <div className="mb-6 space-y-2">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground transition hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {copy.brain.back}
        </Link>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="min-w-0 flex-1">{title}</h1>
          {actions ? <div className="shrink-0">{actions}</div> : null}
        </div>
        {description ? (
          <p className="text-sm text-muted-foreground">{description}</p>
        ) : null}
      </div>
      {children}
    </motion.section>
  );
}
