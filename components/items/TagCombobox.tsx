'use client';

import { useMemo, useRef, useState } from 'react';

import { Input } from '@/components/ui/input';
import { copy, fill } from '@/lib/copy';
import { cn } from '@/lib/utils';

type TagOption = { id: string; name: string };

type TagComboboxProps = {
  options: TagOption[];
  disabled?: boolean;
  onSelect: (tag: TagOption) => void;
  onCreate: (name: string) => void;
  className?: string;
};

export function TagCombobox({
  options,
  disabled,
  onSelect,
  onCreate,
  className,
}: TagComboboxProps) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const trimmed = query.trim();
  const normalized = trimmed.toLowerCase();

  const matches = useMemo(() => {
    if (!normalized) return options.slice(0, 8);
    return options.filter((tag) => tag.name.toLowerCase().includes(normalized)).slice(0, 8);
  }, [options, normalized]);

  const exactMatch = useMemo(
    () => options.find((tag) => tag.name.toLowerCase() === normalized),
    [options, normalized],
  );

  const showCreate = trimmed.length > 0 && !exactMatch;

  function commit(tag?: TagOption) {
    if (tag) {
      onSelect(tag);
      setQuery('');
      setOpen(false);
      return;
    }
    if (exactMatch) {
      onSelect(exactMatch);
      setQuery('');
      setOpen(false);
      return;
    }
    if (trimmed) {
      onCreate(trimmed);
      setQuery('');
      setOpen(false);
    }
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <Input
        value={query}
        disabled={disabled}
        placeholder={copy.tags.placeholder}
        autoComplete='off'
        onFocus={() => setOpen(true)}
        onBlur={() => {
          window.setTimeout(() => {
            if (!rootRef.current?.contains(document.activeElement)) {
              setOpen(false);
            }
          }, 100);
        }}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault();
            if (exactMatch) {
              commit(exactMatch);
            } else if (trimmed) {
              commit();
            } else if (matches[0]) {
              commit(matches[0]);
            }
          }
          if (event.key === 'Escape') {
            setOpen(false);
          }
        }}
      />
      {open && (matches.length > 0 || showCreate) ? (
        <ul
          className='absolute z-20 mt-1 max-h-48 w-full overflow-auto rounded-md border border-border bg-popover p-1 shadow-md'
          role='listbox'
        >
          {matches.map((tag) => (
            <li key={tag.id}>
              <button
                type='button'
                role='option'
                aria-selected={false}
                className='flex w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm hover:bg-accent hover:text-accent-foreground'
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit(tag)}
              >
                #{tag.name}
              </button>
            </li>
          ))}
          {showCreate ? (
            <li>
              <button
                type='button'
                role='option'
                aria-selected={false}
                className='flex w-full cursor-pointer rounded-sm px-2 py-1.5 text-left text-sm text-primary hover:bg-accent'
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => commit()}
              >
                {fill(copy.tags.createNamed, { name: trimmed })}
              </button>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
  );
}
