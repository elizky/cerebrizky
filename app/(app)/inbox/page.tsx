import { ItemType } from "@prisma/client";

import { RegionShell } from "@/components/brain/RegionShell";
import { CreateItemForm } from "@/components/items/CreateItemForm";
import { ItemList } from "@/components/items/ItemList";
import { listItems } from "@/server/items";

export default async function InboxPage() {
  const [items, projects] = await Promise.all([
    listItems({ type: ItemType.IDEA }),
    listItems({ type: ItemType.PROJECT }),
  ]);

  return (
    <RegionShell
      layoutId="region-inbox"
      title="Inbox"
      description="Unsorted captures. Classify them into notes, tasks, or other regions."
    >
      <div className="mb-6">
        <CreateItemForm
          defaultType={ItemType.IDEA}
          projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        />
      </div>
      <ItemList items={items} />
    </RegionShell>
  );
}
