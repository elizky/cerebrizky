'use client';

import { Brain, LogOut, Search } from 'lucide-react';
import Link from 'next/link';

import { MESH_TEMPLATES } from '@/components/brain/MeshBackground';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import type { BackgroundMode } from '@/lib/background';
import { copy } from '@/lib/copy';
import { cn } from '@/lib/utils';
import { signOutAction } from '@/server/auth-actions';

type UserMenuProps = {
  userName?: string | null;
  backgroundMode: BackgroundMode;
  onBackgroundModeChange: (mode: BackgroundMode) => void;
};

export function UserMenu({ backgroundMode, onBackgroundModeChange }: UserMenuProps) {
  const meshLabels = copy.app.mesh;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'inline-flex cursor-pointer items-center gap-1.5 rounded-md px-1.5 py-1 text-primary outline-none transition',
          'hover:bg-accent/40 hover:text-primary/80 focus-visible:ring-2 focus-visible:ring-ring',
        )}
        aria-label={copy.app.name}
      >
        <Brain className='h-6 w-6' />
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='min-w-48'>
        <DropdownMenuItem asChild>
          <Link href='/search'>
            <Search />
            {copy.brain.searchLabel}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>{copy.app.meshTemplates}</DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuRadioGroup
              value={backgroundMode}
              onValueChange={(value) => onBackgroundModeChange(value as BackgroundMode)}
            >
              <DropdownMenuRadioItem value='Aurora'>{copy.app.aurora}</DropdownMenuRadioItem>
              {MESH_TEMPLATES.map((template) => (
                <DropdownMenuRadioItem key={template} value={template}>
                  {meshLabels[template]}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant='destructive'
          onSelect={() => {
            void signOutAction();
          }}
        >
          <LogOut />
          {copy.auth.signOut}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
