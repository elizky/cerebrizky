import { ItemType } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RegionShell } from "@/components/brain/RegionShell";
import { ItemDetailForm } from "@/components/items/ItemDetailForm";
import { ItemDetailView } from "@/components/items/ItemDetailView";
import { Button } from "@/components/ui/button";
import { copy } from "@/lib/copy";
import { getItem, listItems } from "@/server/items";
import { listTags } from "@/server/tags";

export default async function ItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ edit?: string }>;
}) {
  const { id } = await params;
  const { edit } = await searchParams;
  const isEditing = edit === "1";

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
      actions={
        isEditing ? (
          <Button asChild variant="ghost" size="sm">
            <Link href={`/items/${item.id}`}>{copy.items.cancel}</Link>
          </Button>
        ) : (
          <Button asChild size="sm">
            <Link href={`/items/${item.id}?edit=1`}>{copy.items.edit}</Link>
          </Button>
        )
      }
    >
      {isEditing ? (
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
      ) : (
        <ItemDetailView item={item} />
      )}
    </RegionShell>
  );
}
