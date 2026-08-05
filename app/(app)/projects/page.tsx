import { ItemType } from "@prisma/client";

import { RegionShell } from "@/components/brain/RegionShell";
import { CreateItemForm } from "@/components/items/CreateItemForm";
import { ItemList } from "@/components/items/ItemList";
import { listItems } from "@/server/items";

export default async function ProjectsPage() {
  const items = await listItems({ type: ItemType.PROJECT });

  return (
    <RegionShell
      layoutId="region-project"
      title="Projects"
      description="Containers that gather related items."
    >
      <div className="mb-6">
        <CreateItemForm defaultType={ItemType.PROJECT} />
      </div>
      <ItemList items={items} />
    </RegionShell>
  );
}
