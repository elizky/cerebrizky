import { ItemType } from '@prisma/client';
import { z } from 'zod';

import { copy } from '@/lib/copy';

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export const registerSchema = z.object({
  name: z.string().min(1).max(80),
  email: z.string().email(),
  password: z.string().min(6),
});

export const itemTypeSchema = z.nativeEnum(ItemType);

export const quickCaptureSchema = z.object({
  title: z.string().min(1).max(300),
  content: z.string().max(20000).optional(),
});

export const createItemSchema = z.object({
  type: itemTypeSchema,
  title: z.string().min(1).max(300),
  content: z.string().max(50000).optional().nullable(),
  url: z.string().url().optional().nullable().or(z.literal('')),
  status: z.string().min(1).max(40).optional(),
  dueAt: z.string().datetime().optional().nullable(),
  projectId: z.string().cuid().optional().nullable(),
  metadata: z.record(z.string(), z.unknown()).optional().nullable(),
});

export const updateItemSchema = createItemSchema.partial().extend({
  id: z.string().cuid(),
  archived: z.boolean().optional(),
});

export const tagSchema = z.object({
  name: z.string().min(1).max(60),
});

export const assignTagSchema = z.object({
  itemId: z.string().cuid(),
  tagId: z.string().cuid(),
});

export const relationSchema = z.object({
  sourceId: z.string().cuid(),
  targetId: z.string().cuid(),
});

export const searchSchema = z.object({
  q: z.string().min(1).max(200),
});

export const DEFAULT_STATUS: Record<ItemType, string> = {
  IDEA: 'inbox',
  NOTE: 'active',
  TASK: 'todo',
  LINK: 'active',
  BOOK: 'to_read',
  PROJECT: 'active',
  GAME: 'wishlist',
  MUSIC: 'to_listen',
  WRITING: 'active',
};

export const STATUS_OPTIONS: Record<ItemType, readonly string[]> = {
  IDEA: ['inbox'],
  NOTE: ['active'],
  TASK: ['todo', 'doing', 'done'],
  LINK: ['active'],
  BOOK: ['to_read', 'reading', 'done'],
  PROJECT: ['active', 'paused', 'done'],
  GAME: ['wishlist', 'playing', 'done'],
  MUSIC: ['to_listen', 'listening', 'done'],
  WRITING: ['active'],
};

export function hasWorkflow(type: ItemType): boolean {
  return STATUS_OPTIONS[type].length > 1;
}

export function isValidStatus(type: ItemType, status: string): boolean {
  return (STATUS_OPTIONS[type] as readonly string[]).includes(status);
}

export function resolveStatus(type: ItemType, status?: string | null): string {
  if (status && isValidStatus(type, status)) {
    return status;
  }
  return DEFAULT_STATUS[type];
}

export const REGION_META: Record<
  ItemType,
  { label: string; href: string; description: string; accent: string }
> = {
  IDEA: {
    label: copy.regions.IDEA.label,
    href: '/inbox',
    description: copy.regions.IDEA.description,
    accent: 'from-primary/35 to-accent/50',
  },
  NOTE: {
    label: copy.regions.NOTE.label,
    href: '/notes',
    description: copy.regions.NOTE.description,
    accent: 'from-chart-3/80 to-accent/40',
  },
  TASK: {
    label: copy.regions.TASK.label,
    href: '/tasks',
    description: copy.regions.TASK.description,
    accent: 'from-muted/10 to-primary/25',
  },
  PROJECT: {
    label: copy.regions.PROJECT.label,
    href: '/projects',
    description: copy.regions.PROJECT.description,
    accent: 'from-ring/10 to-accent/50',
  },
  LINK: {
    label: copy.regions.LINK.label,
    href: '/links',
    description: copy.regions.LINK.description,
    accent: 'from-chart-3/10 to-primary/10',
  },
  BOOK: {
    label: copy.regions.BOOK.label,
    href: '/books',
    description: copy.regions.BOOK.description,
    accent: 'from-accent/75 to-primary/20',
  },
  GAME: {
    label: copy.regions.GAME.label,
    href: '/games',
    description: copy.regions.GAME.description,
    accent: 'from-ring/30 to-primary/15',
  },
  MUSIC: {
    label: copy.regions.MUSIC.label,
    href: '/music',
    description: copy.regions.MUSIC.description,
    accent: 'from-chart-2/20 to-accent/40',
  },
  WRITING: {
    label: copy.regions.WRITING.label,
    href: '/writings',
    description: copy.regions.WRITING.description,
    accent: 'from-primary/20 to-muted',
  },
};
