"use server";

import { revalidatePath } from "next/cache";

import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { assignTagSchema, tagSchema } from "@/lib/validations/item";
import { requireUserId } from "@/server/auth";

export async function listTags() {
  const userId = await requireUserId();
  return db.tag.findMany({
    where: { userId },
    orderBy: { name: "asc" },
  });
}

export async function createTag(input: unknown) {
  const userId = await requireUserId();
  const data = tagSchema.parse(input);
  const slug = slugify(data.name);

  const tag = await db.tag.upsert({
    where: { userId_slug: { userId, slug } },
    update: { name: data.name },
    create: { userId, name: data.name, slug },
  });

  revalidatePath("/");
  return tag;
}

export async function assignTag(input: unknown) {
  const userId = await requireUserId();
  const data = assignTagSchema.parse(input);

  const [item, tag] = await Promise.all([
    db.item.findFirst({ where: { id: data.itemId, userId } }),
    db.tag.findFirst({ where: { id: data.tagId, userId } }),
  ]);

  if (!item || !tag) {
    throw new Error("Item or tag not found");
  }

  await db.itemTag.upsert({
    where: {
      itemId_tagId: { itemId: data.itemId, tagId: data.tagId },
    },
    update: {},
    create: { itemId: data.itemId, tagId: data.tagId },
  });

  revalidatePath(`/items/${data.itemId}`);
  return { ok: true };
}

export async function removeTag(input: unknown) {
  const userId = await requireUserId();
  const data = assignTagSchema.parse(input);

  const item = await db.item.findFirst({ where: { id: data.itemId, userId } });
  if (!item) {
    throw new Error("Item not found");
  }

  await db.itemTag.deleteMany({
    where: { itemId: data.itemId, tagId: data.tagId },
  });

  revalidatePath(`/items/${data.itemId}`);
  return { ok: true };
}
