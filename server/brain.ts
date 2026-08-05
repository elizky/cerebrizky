"use server";

import { ItemType } from "@prisma/client";

import { db } from "@/lib/db";
import { REGION_META } from "@/lib/validations/item";
import { requireUserId } from "@/server/auth";

export type BrainRegion = {
  type: ItemType;
  label: string;
  href: string;
  description: string;
  count: number;
};

export async function getBrainRegions(): Promise<{
  regions: BrainRegion[];
  inboxCount: number;
  totalCount: number;
}> {
  const userId = await requireUserId();

  const grouped = await db.item.groupBy({
    by: ["type"],
    where: { userId, archivedAt: null },
    _count: { _all: true },
  });

  const counts = Object.fromEntries(
    grouped.map((row) => [row.type, row._count._all])
  ) as Partial<Record<ItemType, number>>;

  const inboxCount = counts.IDEA ?? 0;
  const totalCount = grouped.reduce((sum, row) => sum + row._count._all, 0);

  const regionTypes: ItemType[] = [
    ItemType.NOTE,
    ItemType.TASK,
    ItemType.PROJECT,
    ItemType.LINK,
    ItemType.BOOK,
  ];

  const regions: BrainRegion[] = regionTypes
    .filter((type) => (counts[type] ?? 0) > 0)
    .map((type) => {
      const meta = REGION_META[type];
      return {
        type,
        label: meta.label,
        href: meta.href,
        description: meta.description,
        count: counts[type] ?? 0,
      };
    });

  return { regions, inboxCount, totalCount };
}
