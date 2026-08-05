import { ItemType } from "@prisma/client";

import { RegionShell } from "@/components/brain/RegionShell";
import { CreateItemTrigger } from "@/components/items/CreateItemTrigger";
import { StatusBoard } from "@/components/items/StatusBoard";
import { copy } from "@/lib/copy";
import { listItems } from "@/server/items";

export default async function TasksPage() {
  const [items, projects] = await Promise.all([
    listItems({ type: ItemType.TASK }),
    listItems({ type: ItemType.PROJECT }),
  ]);

  return (
    <RegionShell
      layoutId="region-task"
      title={copy.regions.TASK.label}
      description={copy.regions.TASK.pageDescription}
      actions={
        <CreateItemTrigger
          defaultType={ItemType.TASK}
          projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        />
      }
    >
      <StatusBoard type={ItemType.TASK} items={items} />
    </RegionShell>
  );
}
