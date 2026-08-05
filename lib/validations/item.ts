import { ItemType } from "@prisma/client";
import { z } from "zod";

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
  url: z.string().url().optional().nullable().or(z.literal("")),
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
  IDEA: "inbox",
  NOTE: "active",
  TASK: "todo",
  LINK: "active",
  BOOK: "to_read",
  PROJECT: "active",
};

export const REGION_META: Record<
  ItemType,
  { label: string; href: string; description: string; accent: string }
> = {
  IDEA: {
    label: "Inbox",
    href: "/inbox",
    description: "Unsorted captures waiting to be classified",
    accent: "from-primary/35 to-accent/50",
  },
  NOTE: {
    label: "Notes",
    href: "/notes",
    description: "Written thought",
    accent: "from-chart-3/80 to-accent/40",
  },
  TASK: {
    label: "Tasks",
    href: "/tasks",
    description: "Things to do",
    accent: "from-primary/25 to-muted",
  },
  PROJECT: {
    label: "Projects",
    href: "/projects",
    description: "Containers of work",
    accent: "from-ring/25 to-accent/50",
  },
  LINK: {
    label: "Links",
    href: "/links",
    description: "Saved URLs",
    accent: "from-chart-2/20 to-muted",
  },
  BOOK: {
    label: "Books",
    href: "/books",
    description: "Reading list",
    accent: "from-chart-1/25 to-accent/40",
  },
};
