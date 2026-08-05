'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';

import { AuroraBackground, type AuroraBand } from '@/components/brain/AuroraBackground';
import { MESH_TEMPLATES, MeshBackground } from '@/components/brain/MeshBackground';
import { QuickCapture } from '@/components/capture/QuickCapture';
import { UserMenu } from '@/components/layout/UserMenu';
import type { BackgroundMode } from '@/lib/background';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';

const BG_STORAGE_KEY = 'cerebrizky.background-mode';

function isBackgroundMode(value: string): value is BackgroundMode {
  return value === 'Aurora' || (MESH_TEMPLATES as readonly string[]).includes(value);
}

function readStoredMode(): BackgroundMode {
  if (typeof window === 'undefined') return 'Aurora';
  const stored = window.localStorage.getItem(BG_STORAGE_KEY);
  return stored && isBackgroundMode(stored) ? stored : 'Aurora';
}

export function AppShell({
  children,
  userName,
  auroraBands,
  totalCount,
}: {
  children: React.ReactNode;
  userName?: string | null;
  auroraBands: AuroraBand[];
  totalCount: number;
}) {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [mode, setMode] = useState<BackgroundMode>(readStoredMode);

  function handleModeChange(next: BackgroundMode) {
    setMode(next);
    window.localStorage.setItem(BG_STORAGE_KEY, next);
  }

  return (
    <div className='relative flex min-h-dvh flex-col bg-[#222222]'>
      {mode === 'Aurora' ? (
        <AuroraBackground className='fixed inset-0 z-0' bands={auroraBands} />
      ) : (
        <MeshBackground className='fixed inset-0 z-0' meshStyle={mode} />
      )}
      <div className='relative z-10 flex min-h-0 w-full flex-1 flex-col px-4 pt-4 md:px-8'>
        <header className='mb-4 flex shrink-0 items-center gap-3 md:gap-4'>
          {isHome ? (
            <p className='hidden md:block min-w-0 max-w-sm text-sm text-muted-foreground lg:max-w-xl'>
              {totalCount === 0 ? copy.brain.empty : copy.brain.populated}
            </p>
          ) : null}
          <div className='ml-auto flex w-full md:w-auto min-w-0 items-center gap-3 justify-between'>
            <div className='w-full shrink md:w-96'>
              <QuickCapture />
            </div>
            <UserMenu
              userName={userName}
              backgroundMode={mode}
              onBackgroundModeChange={handleModeChange}
            />
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
