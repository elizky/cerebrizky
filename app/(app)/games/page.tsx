import { ItemType } from '@prisma/client';

import { RegionShell } from '@/components/brain/RegionShell';
import { CreateItemTrigger } from '@/components/items/CreateItemTrigger';
import { StatusBoard } from '@/components/items/StatusBoard';
import { copy } from '@/lib/copy';
import { listItems } from '@/server/items';

export default async function GamesPage() {
  const [items, projects] = await Promise.all([
    listItems({ type: ItemType.GAME }),
    listItems({ type: ItemType.PROJECT }),
  ]);

  return (
    <RegionShell
      layoutId='region-game'
      title={copy.regions.GAME.label}
      description={copy.regions.GAME.pageDescription}
      actions={
        <CreateItemTrigger
          defaultType={ItemType.GAME}
          projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        />
      }
    >
      <StatusBoard type={ItemType.GAME} items={items} />
    </RegionShell>
  );
}
