'use server';

import { revalidatePath } from 'next/cache';

import { copy } from '@/lib/copy';
import { db } from '@/lib/db';
import { relationSchema } from '@/lib/validations/item';
import { requireUserId } from '@/server/auth';

export async function createRelation(input: unknown) {
  const userId = await requireUserId();
  const data = relationSchema.parse(input);

  if (data.sourceId === data.targetId) {
    throw new Error(copy.errors.selfRelation);
  }

  const [source, target] = await Promise.all([
    db.item.findFirst({ where: { id: data.sourceId, userId } }),
    db.item.findFirst({ where: { id: data.targetId, userId } }),
  ]);

  if (!source || !target) {
    throw new Error(copy.errors.itemsNotFound);
  }

  const relation = await db.itemRelation.upsert({
    where: {
      sourceId_targetId: {
        sourceId: data.sourceId,
        targetId: data.targetId,
      },
    },
    update: {},
    create: {
      sourceId: data.sourceId,
      targetId: data.targetId,
    },
  });

  revalidatePath(`/items/${data.sourceId}`);
  revalidatePath(`/items/${data.targetId}`);
  return relation;
}

export async function deleteRelation(id: string) {
  const userId = await requireUserId();

  const relation = await db.itemRelation.findFirst({
    where: {
      id,
      OR: [{ source: { userId } }, { target: { userId } }],
    },
  });

  if (!relation) {
    throw new Error(copy.errors.relationNotFound);
  }

  await db.itemRelation.delete({ where: { id } });
  revalidatePath(`/items/${relation.sourceId}`);
  revalidatePath(`/items/${relation.targetId}`);
  return { ok: true };
}
