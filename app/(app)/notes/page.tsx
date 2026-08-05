import { ItemType } from '@prisma/client';

import { RegionShell } from '@/components/brain/RegionShell';
import { CreateItemTrigger } from '@/components/items/CreateItemTrigger';
import { ItemList } from '@/components/items/ItemList';
import { copy } from '@/lib/copy';
import { listItems } from '@/server/items';

export default async function NotesPage() {
  const [items, projects] = await Promise.all([
    listItems({ type: ItemType.NOTE }),
    listItems({ type: ItemType.PROJECT }),
  ]);

  return (
    <RegionShell
      layoutId='region-note'
      title={copy.regions.NOTE.label}
      description={copy.regions.NOTE.pageDescription}
      actions={
        <CreateItemTrigger
          defaultType={ItemType.NOTE}
          projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        />
      }
    >
      <ItemList items={items} />
    </RegionShell>
  );
}
