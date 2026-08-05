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
        className={cn('relative overflow-hidden rounded-1xl border-0 bg-primary/5 p-5', accent)}
      >
        <div className='flex items-start justify-between gap-3'>
          <h2 className='relative z-10 leading-tight'>{label}</h2>
          <p
            aria-hidden
            className='pointer-events-none absolute right-0 top-0 z-10 select-none text-9xl font-black tabular-nums leading-none text-primary/10'
          >
            {count}
          </p>
        </div>
        <p className='mt-2 text-sm text-muted-foreground'>{description}</p>
        <p className='mt-3 text-xs text-muted-foreground/90'>{meta}</p>
      </motion.article>
    </Link>
  );
}
