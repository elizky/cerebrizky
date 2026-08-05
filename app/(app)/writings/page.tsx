import { ItemType } from '@prisma/client';

import { RegionShell } from '@/components/brain/RegionShell';
import { CreateItemTrigger } from '@/components/items/CreateItemTrigger';
import { ItemList } from '@/components/items/ItemList';
import { copy } from '@/lib/copy';
import { listItems } from '@/server/items';

export default async function WritingsPage() {
  const [rawItems, projects] = await Promise.all([
    listItems({ type: ItemType.WRITING, orderBy: { title: 'desc' } }),
    listItems({ type: ItemType.PROJECT }),
  ]);

  const items = [...rawItems].sort((a, b) =>
    b.title.localeCompare(a.title, 'es', { numeric: true, sensitivity: 'base' }),
  );

  return (
    <RegionShell
      layoutId='region-writing'
      title={copy.regions.WRITING.label}
      description={copy.regions.WRITING.pageDescription}
      actions={
        <CreateItemTrigger
          defaultType={ItemType.WRITING}
          projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        />
      }
    >
      <ItemList items={items} />
    </RegionShell>
  );
}
