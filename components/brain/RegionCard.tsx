'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';

import { cn } from '@/lib/utils';

type RegionCardProps = {
  href: string;
  layoutId: string;
  label: string;
  description: string;
  meta: string;
  count: number;
  accent?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function RegionCard({
  href,
  layoutId,
  label,
  description,
  meta,
  count,
  accent = 'from-primary/30 to-accent/40',
  className,
  style,
}: RegionCardProps) {
  return (
    <Link href={href} className={cn('block w-full', className)} style={style}>
      <motion.article
        layoutId={layoutId}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.985 }}
        transition={{ type: 'spring', stiffness: 320, damping: 28 }}
        className={cn('rounded-lg border border-border bg-linear-to-br p-5 shadow-md', accent)}
      >
        <div className='flex items-start justify-between gap-3'>
          <h2 className='leading-tight'>{label}</h2>
          <p className='fixed top-0 right-0 text-9xl z-10 text-primary/10 font-black'>{count}</p>
        </div>
        <p className='mt-2 text-sm text-muted-foreground'>{description}</p>
        <p className='mt-3 text-xs text-muted-foreground/90'>{meta}</p>
      </motion.article>
    </Link>
  );
}
