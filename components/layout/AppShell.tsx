'use client';

import { usePathname } from 'next/navigation';

import { BrainBackground, type BrainBand } from '@/components/brain/BrainBackground';
import { QuickCapture } from '@/components/capture/QuickCapture';
import { UserMenu } from '@/components/layout/UserMenu';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

export function AppShell({
  children,
  bands,
  totalCount,
}: {
  children: React.ReactNode;
  bands: BrainBand[];
  totalCount: number;
}) {
  const pathname = usePathname();
  const isHome = pathname === '/';

  return (
    <div className='relative flex min-h-dvh flex-col bg-[#222222]'>
      <BrainBackground className='fixed inset-0 z-0' bands={bands} />
      <div className='relative z-10 flex min-h-0 w-full flex-1 flex-col px-4 pt-4 md:px-8'>
        <header className='mb-4 flex shrink-0 items-center gap-3 md:gap-4'>
          {isHome ? (
            <p className='hidden min-w-0 max-w-sm text-sm text-muted-foreground md:block lg:max-w-xl'>
              {totalCount === 0 ? copy.brain.empty : copy.brain.populated}
            </p>
          ) : null}
          <div className='ml-auto flex w-full min-w-0 items-center justify-between gap-3 md:w-auto'>
            <div className='w-full shrink md:w-96'>
              <QuickCapture />
            </div>
            <UserMenu />
          </div>
        </header>
        <main
          className={cn(
            'relative z-10 min-h-0 flex-1',
            isHome ? 'flex flex-col pb-0' : 'mx-auto w-full max-w-7xl pb-10',
          )}
        >
          {children}
        </main>
      </div>
    </div>
  );
}
