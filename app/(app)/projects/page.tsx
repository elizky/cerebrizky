import { ItemType } from "@prisma/client";

import { RegionShell } from "@/components/brain/RegionShell";
import { CreateItemTrigger } from "@/components/items/CreateItemTrigger";
import { ItemList } from "@/components/items/ItemList";
import { copy } from "@/lib/copy";
import { listItems } from "@/server/items";

export default async function ProjectsPage() {
  const items = await listItems({ type: ItemType.PROJECT });

  return (
    <RegionShell
      layoutId="region-project"
      title={copy.regions.PROJECT.label}
      description={copy.regions.PROJECT.pageDescription}
      actions={<CreateItemTrigger defaultType={ItemType.PROJECT} />}
    >
      <ItemList items={items} />
    </RegionShell>
  );
}
