'use server';

import { ItemType } from '@prisma/client';

import { copy, fill } from '@/lib/copy';
import { db } from '@/lib/db';
import { formatRelativeShort } from '@/lib/relative-time';
import { REGION_META } from '@/lib/validations/item';
import { requireUserId } from '@/server/auth';

export type BrainModule = {
  key: string;
  type?: ItemType;
  label: string;
  href: string;
  description: string;
  count: number;
  meta: string;
  accent: string;
  layoutId: string;
  always?: boolean;
};

export async function getBrainOverview(): Promise<{
  modules: BrainModule[];
  totalCount: number;
}> {
  const userId = await requireUserId();
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const [
    grouped,
    pendingTasks,
    activeProjects,
    toReadBooks,
    wishlistGames,
    toListenMusic,
    newIdeas,
  ] = await Promise.all([
    db.item.groupBy({
      by: ['type'],
      where: { userId, archivedAt: null },
      _count: { _all: true },
      _max: { updatedAt: true },
    }),
    db.item.count({
      where: {
        userId,
        archivedAt: null,
        type: ItemType.TASK,
        status: { in: ['todo', 'doing'] },
      },
    }),
    db.item.count({
      where: {
        userId,
        archivedAt: null,
        type: ItemType.PROJECT,
        status: 'active',
      },
    }),
    db.item.count({
      where: {
        userId,
        archivedAt: null,
        type: ItemType.BOOK,
        status: 'to_read',
      },
    }),
    db.item.count({
      where: {
        userId,
        archivedAt: null,
        type: ItemType.GAME,
        status: 'wishlist',
      },
    }),
    db.item.count({
      where: {
        userId,
        archivedAt: null,
        type: ItemType.MUSIC,
        status: 'to_listen',
      },
    }),
    db.item.count({
      where: {
        userId,
        archivedAt: null,
        type: ItemType.IDEA,
        createdAt: { gte: weekAgo },
      },
    }),
  ]);

  const counts = Object.fromEntries(grouped.map((row) => [row.type, row._count._all])) as Partial<
    Record<ItemType, number>
  >;

  const latest = Object.fromEntries(
    grouped
      .filter((row) => row._max.updatedAt)
      .map((row) => [row.type, row._max.updatedAt as Date]),
  ) as Partial<Record<ItemType, Date>>;

  const totalCount = grouped.reduce((sum, row) => sum + row._count._all, 0);
  const inboxCount = counts.IDEA ?? 0;

  function metaFor(type: ItemType, count: number): string {
    const last = latest[type];

    switch (type) {
      case ItemType.IDEA:
        if (newIdeas > 0) {
          return fill(copy.brain.meta.newCount, { n: newIdeas });
        }
        return fill(copy.brain.meta.unclassified, { n: count });
      case ItemType.NOTE:
      case ItemType.WRITING:
        return last
          ? fill(copy.brain.meta.lastFeminine, {
              when: formatRelativeShort(last),
            })
          : copy.brain.meta.empty;
      case ItemType.TASK:
        return fill(copy.brain.meta.pending, { n: pendingTasks });
      case ItemType.PROJECT:
        return fill(copy.brain.meta.active, { n: activeProjects });
      case ItemType.LINK:
        return last
          ? fill(copy.brain.meta.lastMasculine, {
              when: formatRelativeShort(last),
            })
          : copy.brain.meta.empty;
      case ItemType.BOOK:
        if (toReadBooks > 0) {
          return fill(copy.brain.meta.toRead, { n: toReadBooks });
        }
        return last
          ? fill(copy.brain.meta.lastMasculine, {
              when: formatRelativeShort(last),
            })
          : copy.brain.meta.empty;
      case ItemType.GAME:
        if (wishlistGames > 0) {
          return fill(copy.brain.meta.wishlist, { n: wishlistGames });
        }
        return last
          ? fill(copy.brain.meta.lastMasculine, {
              when: formatRelativeShort(last),
            })
          : copy.brain.meta.empty;
      case ItemType.MUSIC:
        if (toListenMusic > 0) {
          return fill(copy.brain.meta.toListen, { n: toListenMusic });
        }
        return last
          ? fill(copy.brain.meta.lastFeminine, {
              when: formatRelativeShort(last),
            })
          : copy.brain.meta.empty;
      default:
        return copy.brain.meta.empty;
    }
  }

  const modules: BrainModule[] = [
    {
      key: 'inbox',
      type: ItemType.IDEA,
      label: REGION_META.IDEA.label,
      href: REGION_META.IDEA.href,
      description: REGION_META.IDEA.description,
      count: inboxCount,
      meta: metaFor(ItemType.IDEA, inboxCount),
      accent: 'from-primary/35 to-accent/50',
      layoutId: 'region-inbox',
      always: true,
    },
  ];

  const regionTypes: ItemType[] = [
    ItemType.NOTE,
    ItemType.TASK,
    ItemType.PROJECT,
    ItemType.LINK,
    ItemType.BOOK,
    ItemType.GAME,
    ItemType.MUSIC,
    ItemType.WRITING,
  ];

  for (const type of regionTypes) {
    const count = counts[type] ?? 0;
    if (count === 0) continue;
    const region = REGION_META[type];
    modules.push({
      key: type,
      type,
      label: region.label,
      href: region.href,
      description: region.description,
      count,
      meta: metaFor(type, count),
      accent: region.accent,
      layoutId: `region-${type.toLowerCase()}`,
    });
  }

  return { modules, totalCount };
}
