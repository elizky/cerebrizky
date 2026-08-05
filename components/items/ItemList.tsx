import { ItemType } from "@prisma/client";
import { Pencil } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { copy, fill, statusLabel } from "@/lib/copy";
import { hasWorkflow, REGION_META } from "@/lib/validations/item";

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

function itemHref(item: ItemListItem, edit = false) {
  if (item.type === ItemType.PROJECT && !edit) {
    return `/projects/${item.id}`;
  }
  return edit ? `/items/${item.id}?edit=1` : `/items/${item.id}`;
}

export function ItemList({ items }: { items: ItemListItem[] }) {
  if (items.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
        {copy.items.empty}
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="relative">
          <Link
            href={itemHref(item)}
            className="block rounded-lg border border-border bg-popover px-4 py-3 pr-12 transition hover:border-ring/40 hover:bg-accent/40"
          >
            <div className="flex flex-wrap items-center gap-2">
              <h3>{item.title}</h3>
              {hasWorkflow(item.type) ? (
                <Badge variant="outline">{statusLabel(item.status)}</Badge>
              ) : null}
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
                {fill(copy.items.projectLabel, { title: item.project.title })}
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
          <Link
            href={itemHref(item, true)}
            aria-label={copy.items.editItem}
            title={copy.items.edit}
            className="absolute right-2 top-2 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
          >
            <Pencil className="h-4 w-4" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
