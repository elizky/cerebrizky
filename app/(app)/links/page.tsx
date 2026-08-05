import { ItemType } from '@prisma/client';

import { RegionShell } from '@/components/brain/RegionShell';
import { CreateItemTrigger } from '@/components/items/CreateItemTrigger';
import { ItemList } from '@/components/items/ItemList';
import { copy } from '@/lib/copy';
import { listItems } from '@/server/items';

export default async function LinksPage() {
  const [items, projects] = await Promise.all([
    listItems({ type: ItemType.LINK }),
    listItems({ type: ItemType.PROJECT }),
  ]);

  return (
    <RegionShell
      layoutId='region-link'
      title={copy.regions.LINK.label}
      description={copy.regions.LINK.pageDescription}
      actions={
        <CreateItemTrigger
          defaultType={ItemType.LINK}
          projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        />
      }
    >
      <ItemList items={items} />
    </RegionShell>
  );
}
