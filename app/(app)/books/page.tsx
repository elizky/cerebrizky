import { ItemType } from '@prisma/client';

import { RegionShell } from '@/components/brain/RegionShell';
import { CreateItemTrigger } from '@/components/items/CreateItemTrigger';
import { StatusBoard } from '@/components/items/StatusBoard';
import { copy } from '@/lib/copy';
import { listItems } from '@/server/items';

export default async function BooksPage() {
  const [items, projects] = await Promise.all([
    listItems({ type: ItemType.BOOK }),
    listItems({ type: ItemType.PROJECT }),
  ]);

  return (
    <RegionShell
      layoutId='region-book'
      title={copy.regions.BOOK.label}
      description={copy.regions.BOOK.pageDescription}
      actions={
        <CreateItemTrigger
          defaultType={ItemType.BOOK}
          projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        />
      }
    >
      <StatusBoard type={ItemType.BOOK} items={items} />
    </RegionShell>
  );
}
