import { ItemType } from "@prisma/client";
import { notFound } from "next/navigation";

import { RegionShell } from "@/components/brain/RegionShell";
import { ItemDetailForm } from "@/components/items/ItemDetailForm";
import { REGION_META } from "@/lib/validations/item";
import { getItem, listItems } from "@/server/items";
import { listTags } from "@/server/tags";

export default async function ItemDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [item, tags, projects, allItems] = await Promise.all([
    getItem(id),
    listTags(),
    listItems({ type: ItemType.PROJECT }),
    listItems({}),
  ]);

  if (!item) {
    notFound();
  }

  return (
    <RegionShell
      layoutId={`item-${item.id}`}
      title={item.title}
      description={`${REGION_META[item.type].label} · ${item.status}`}
    >
      <ItemDetailForm
        item={item}
        tags={tags}
        projects={projects.map((project) => ({
          id: project.id,
          title: project.title,
        }))}
        relatableItems={allItems.map((candidate) => ({
          id: candidate.id,
          title: candidate.title,
          type: candidate.type,
        }))}
      />
    </RegionShell>
  );
}
