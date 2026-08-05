import { ItemType } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";

import { RegionShell } from "@/components/brain/RegionShell";
import { CreateItemTrigger } from "@/components/items/CreateItemTrigger";
import { ItemList } from "@/components/items/ItemList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { copy, statusLabel } from "@/lib/copy";
import { REGION_META } from "@/lib/validations/item";
import { getItem, listItems } from "@/server/items";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await getItem(id);

  if (!project || project.type !== ItemType.PROJECT) {
    notFound();
  }

  const [children, projects] = await Promise.all([
    listItems({ projectId: project.id }),
    listItems({ type: ItemType.PROJECT }),
  ]);

  const byType = {
    NOTE: children.filter((item) => item.type === ItemType.NOTE),
    TASK: children.filter((item) => item.type === ItemType.TASK),
    LINK: children.filter((item) => item.type === ItemType.LINK),
    BOOK: children.filter((item) => item.type === ItemType.BOOK),
    IDEA: children.filter((item) => item.type === ItemType.IDEA),
  };

  return (
    <RegionShell
      layoutId={`project-${project.id}`}
      title={project.title}
      description={project.content ?? copy.items.projectFallback}
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{statusLabel(project.status)}</Badge>
          <CreateItemTrigger
            defaultType={ItemType.NOTE}
            defaultProjectId={project.id}
            projects={projects.map((p) => ({ id: p.id, title: p.title }))}
          />
          <Button asChild variant="outline" size="sm">
            <Link href={`/items/${project.id}?edit=1`}>{copy.items.edit}</Link>
          </Button>
        </div>
      }
    >
      {(Object.entries(byType) as [keyof typeof byType, typeof children][]).map(
        ([type, items]) =>
          items.length > 0 ? (
            <div key={type} className="mb-8">
              <h2 className="mb-3 text-xl">{REGION_META[type].label}</h2>
              <ItemList items={items} />
            </div>
          ) : null
      )}

      {children.length === 0 ? (
        <p className="text-sm text-muted-foreground">{copy.items.noChildren}</p>
      ) : null}
    </RegionShell>
  );
}
