'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';

import { Input } from '@/components/ui/input';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';
import { quickCapture } from '@/server/items';

export function QuickCapture() {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [focused, setFocused] = useState(false);

  const { capturePlaceholder, captureError, saving } = copy.shell;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      try {
        setError(null);
        await quickCapture({ title: title.trim() });
        setTitle('');
        router.refresh();
      } catch {
        setError(captureError);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className='w-full'>
      <div className={cn('relative overflow-hidden rounded-md', focused && 'ring-0')}>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={pending ? saving : capturePlaceholder}
          disabled={pending}
          className={cn(
            'h-9 rounded-md border-0 border-b border-b-accent bg-transparent shadow-none',
            'placeholder:text-muted-foreground/70 focus-visible:border-primary/40 focus-visible:ring-0 focus-visible:ring-offset-0',
            pending && 'opacity-70',
          )}
          aria-label={capturePlaceholder}
        />
      </div>
      {error ? <p className='mt-1 text-xs text-destructive'>{error}</p> : null}
    </form>
  );
}
