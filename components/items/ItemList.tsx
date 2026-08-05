import Link from "next/link";
import { ItemType } from "@prisma/client";

import { Badge } from "@/components/ui/badge";
import { REGION_META } from "@/lib/validations/item";

type ItemListItem = {
  id: string;
  title: string;
  type: ItemType;
  status: string;
  content: string | null;
  url: string | null;
  updatedAt: Date;
  tags?: { tag: { name: string } }[];
  project?: { id: string; title: string } | null;
};

export function ItemList({ items }: { items: ItemListItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        Nothing here yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={
              item.type === ItemType.PROJECT
                ? `/projects/${item.id}`
                : `/items/${item.id}`
            }
            className="block rounded-lg border border-border bg-popover px-4 py-3 transition hover:border-ring/40 hover:bg-accent/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3>{item.title}</h3>
              <Badge variant="outline">{item.status}</Badge>
              <Badge variant="secondary">{REGION_META[item.type].label}</Badge>
            </div>
            {item.content ? (
              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                {item.content}
              </p>
            ) : null}
            {item.url ? (
              <p className="mt-1 truncate text-xs text-ring">{item.url}</p>
            ) : null}
            {item.project ? (
              <p className="mt-1 text-xs text-muted-foreground">
                Project: {item.project.title}
              </p>
            ) : null}
            {item.tags && item.tags.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-1">
                {item.tags.map(({ tag }) => (
                  <Badge key={tag.name} variant="secondary">
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            ) : null}
          </Link>
        </li>
      ))}
    </ul>
  );
}
