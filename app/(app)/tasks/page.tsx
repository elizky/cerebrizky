import { ItemType } from "@prisma/client";

import { RegionShell } from "@/components/brain/RegionShell";
import { CreateItemForm } from "@/components/items/CreateItemForm";
import { ItemList } from "@/components/items/ItemList";
import { listItems } from "@/server/items";

export default async function TasksPage() {
  const [items, projects] = await Promise.all([
    listItems({ type: ItemType.TASK }),
    listItems({ type: ItemType.PROJECT }),
  ]);

  return (
    <RegionShell
      layoutId="region-task"
      title="Tasks"
      description="Actionable items with status."
    >
      <div className="mb-6">
        <CreateItemForm
          defaultType={ItemType.TASK}
          projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        />
      </div>
      <ItemList items={items} />
    </RegionShell>
  );
}
