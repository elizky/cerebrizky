import { ItemType } from '@prisma/client';

import { RegionShell } from '@/components/brain/RegionShell';
import { CreateItemTrigger } from '@/components/items/CreateItemTrigger';
import { ItemList } from '@/components/items/ItemList';
import { copy } from '@/lib/copy';
import { listItems } from '@/server/items';

export default async function InboxPage() {
  const [items, projects] = await Promise.all([
    listItems({ type: ItemType.IDEA }),
    listItems({ type: ItemType.PROJECT }),
  ]);

  return (
    <RegionShell
      layoutId='region-inbox'
      title={copy.regions.IDEA.label}
      description={copy.regions.IDEA.pageDescription}
      actions={
        <CreateItemTrigger
          defaultType={ItemType.IDEA}
          projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        />
      }
    >
      <ItemList items={items} />
    </RegionShell>
  );
}
