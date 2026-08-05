import { ItemType } from "@prisma/client";
import { notFound } from "next/navigation";

import { RegionShell } from "@/components/brain/RegionShell";
import { CreateItemForm } from "@/components/items/CreateItemForm";
import { ItemList } from "@/components/items/ItemList";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
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
      description={project.content ?? "Project container"}
      actions={
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{project.status}</Badge>
          <Button asChild variant="outline" size="sm">
            <Link href={`/items/${project.id}`}>Edit</Link>
          </Button>
        </div>
      }
    >
      <div className="mb-8">
        <h2 className="mb-3 text-xl">Add to project</h2>
        <CreateItemForm
          defaultType={ItemType.NOTE}
          defaultProjectId={project.id}
          projects={projects.map((p) => ({ id: p.id, title: p.title }))}
        />
      </div>

      {(Object.entries(byType) as [keyof typeof byType, typeof children][]).map(
        ([type, items]) =>
          items.length > 0 ? (
            <div key={type} className="mb-8">
              <h2 className="mb-3 text-xl">{type}</h2>
              <ItemList items={items} />
            </div>
          ) : null
      )}

      {children.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No child items yet. Create one and assign this project.
        </p>
      ) : null}
    </RegionShell>
  );
}
