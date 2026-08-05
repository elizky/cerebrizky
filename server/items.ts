'use server';

import { ItemSource, ItemType, Prisma } from '@prisma/client';
import { revalidatePath } from 'next/cache';

import { copy } from '@/lib/copy';
import { db } from '@/lib/db';
import {
  createItemSchema,
  DEFAULT_STATUS,
  isValidStatus,
  quickCaptureSchema,
  resolveStatus,
  searchSchema,
  updateItemSchema,
} from '@/lib/validations/item';
import { requireUserId } from '@/server/auth';

function revalidateItemPaths(type?: ItemType) {
  revalidatePath('/');
  revalidatePath('/inbox');
  revalidatePath('/search');
  if (type) {
    const map: Record<ItemType, string> = {
      IDEA: '/inbox',
      NOTE: '/notes',
      TASK: '/tasks',
      LINK: '/links',
      BOOK: '/books',
      PROJECT: '/projects',
    };
    revalidatePath(map[type]);
  } else {
    revalidatePath('/notes');
    revalidatePath('/tasks');
    revalidatePath('/links');
    revalidatePath('/books');
    revalidatePath('/projects');
  }
}

export async function quickCapture(input: unknown) {
  const userId = await requireUserId();
  const data = quickCaptureSchema.parse(input);

  const item = await db.item.create({
    data: {
      userId,
      type: ItemType.IDEA,
      source: ItemSource.WEB,
      title: data.title,
      content: data.content ?? null,
      status: DEFAULT_STATUS.IDEA,
    },
  });

  revalidateItemPaths(ItemType.IDEA);
  return item;
}

export async function createItem(input: unknown) {
  const userId = await requireUserId();
  const data = createItemSchema.parse(input);

  if (data.type === ItemType.LINK && !data.url) {
    throw new Error(copy.errors.urlRequired);
  }

  if (data.status && !isValidStatus(data.type, data.status)) {
    throw new Error(copy.errors.invalidStatus);
  }

  if (data.projectId) {
    const project = await db.item.findFirst({
      where: {
        id: data.projectId,
        userId,
        type: ItemType.PROJECT,
        archivedAt: null,
      },
    });
    if (!project) {
      throw new Error(copy.errors.projectNotFound);
    }
  }

  const item = await db.item.create({
    data: {
      userId,
      type: data.type,
      source: ItemSource.WEB,
      title: data.title,
      content: data.content ?? null,
      url: data.url || null,
      status: resolveStatus(data.type, data.status),
      dueAt: data.dueAt ? new Date(data.dueAt) : null,
      projectId: data.type === ItemType.PROJECT ? null : (data.projectId ?? null),
      metadata: (data.metadata as Prisma.InputJsonValue) ?? undefined,
    },
  });

  revalidateItemPaths(data.type);
  revalidatePath(`/items/${item.id}`);
  return item;
}

export async function updateItem(input: unknown) {
  const userId = await requireUserId();
  const data = updateItemSchema.parse(input);

  const existing = await db.item.findFirst({
    where: { id: data.id, userId },
  });
  if (!existing) {
    throw new Error(copy.errors.itemNotFound);
  }

  const nextType = data.type ?? existing.type;
  const nextStatus =
    data.status !== undefined || data.type !== undefined
      ? resolveStatus(nextType, data.status ?? existing.status)
      : undefined;

  if (
    data.status !== undefined &&
    data.status !== nextStatus &&
    !isValidStatus(nextType, data.status)
  ) {
    throw new Error(copy.errors.invalidStatus);
  }

  if (data.projectId) {
    const project = await db.item.findFirst({
      where: {
        id: data.projectId,
        userId,
        type: ItemType.PROJECT,
        archivedAt: null,
      },
    });
    if (!project) {
      throw new Error(copy.errors.projectNotFound);
    }
  }

  const item = await db.item.update({
    where: { id: existing.id },
    data: {
      type: data.type,
      title: data.title,
      content: data.content === undefined ? undefined : data.content,
      url: data.url === undefined ? undefined : data.url || null,
      status: nextStatus,
      dueAt: data.dueAt === undefined ? undefined : data.dueAt ? new Date(data.dueAt) : null,
      projectId:
        nextType === ItemType.PROJECT
          ? null
          : data.projectId === undefined
            ? undefined
            : data.projectId,
      metadata:
        data.metadata === undefined
          ? undefined
          : ((data.metadata as Prisma.InputJsonValue) ?? Prisma.JsonNull),
      archivedAt: data.archived === undefined ? undefined : data.archived ? new Date() : null,
    },
  });

  revalidateItemPaths(item.type);
  revalidatePath(`/items/${item.id}`);
  if (item.projectId) {
    revalidatePath(`/projects/${item.projectId}`);
  }
  return item;
}

export async function archiveItem(id: string) {
  return updateItem({ id, archived: true });
}

export async function restoreItem(id: string) {
  return updateItem({ id, archived: false });
}

export async function deleteItem(id: string) {
  const userId = await requireUserId();
  const existing = await db.item.findFirst({ where: { id, userId } });
  if (!existing) {
    throw new Error(copy.errors.itemNotFound);
  }

  await db.item.delete({ where: { id } });
  revalidateItemPaths(existing.type);
  return { ok: true };
}

export async function listItems(options: {
  type?: ItemType;
  includeArchived?: boolean;
  projectId?: string | null;
  status?: string;
}) {
  const userId = await requireUserId();

  return db.item.findMany({
    where: {
      userId,
      type: options.type,
      projectId: options.projectId === undefined ? undefined : options.projectId,
      status: options.status,
      archivedAt: options.includeArchived ? undefined : null,
    },
    include: {
      tags: { include: { tag: true } },
      project: { select: { id: true, title: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
}

export async function getItem(id: string) {
  const userId = await requireUserId();

  return db.item.findFirst({
    where: { id, userId },
    include: {
      tags: { include: { tag: true } },
      project: { select: { id: true, title: true } },
      children: {
        where: { archivedAt: null },
        orderBy: { updatedAt: 'desc' },
      },
      relationsFrom: {
        include: { target: { select: { id: true, title: true, type: true } } },
      },
      relationsTo: {
        include: { source: { select: { id: true, title: true, type: true } } },
      },
    },
  });
}

export async function searchItems(input: unknown) {
  const userId = await requireUserId();
  const { q } = searchSchema.parse(input);

  return db.item.findMany({
    where: {
      userId,
      archivedAt: null,
      OR: [
        { title: { contains: q, mode: 'insensitive' } },
        { content: { contains: q, mode: 'insensitive' } },
        { url: { contains: q, mode: 'insensitive' } },
      ],
    },
    include: {
      tags: { include: { tag: true } },
    },
    orderBy: { updatedAt: 'desc' },
    take: 50,
  });
}
