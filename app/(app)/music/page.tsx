import { ItemType } from '@prisma/client';

import { RegionShell } from '@/components/brain/RegionShell';
import { CreateItemTrigger } from '@/components/items/CreateItemTrigger';
import { StatusBoard } from '@/components/items/StatusBoard';
import { copy } from '@/lib/copy';
import { listItems } from '@/server/items';

export default async function MusicPage() {
  const [items, projects] = await Promise.all([
    listItems({ type: ItemType.MUSIC }),
    listItems({ type: ItemType.PROJECT }),
  ]);

  return (
    <RegionShell
      layoutId='region-music'
      title={copy.regions.MUSIC.label}
      description={copy.regions.MUSIC.pageDescription}
      actions={
        <CreateItemTrigger
          defaultType={ItemType.MUSIC}
          projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        />
      }
    >
      <StatusBoard type={ItemType.MUSIC} items={items} />
    </RegionShell>
  );
}
