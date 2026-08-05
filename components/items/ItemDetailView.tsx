import { ItemType } from "@prisma/client";
import Link from "next/link";

import { MarkdownContent } from "@/components/items/MarkdownContent";
import { Badge } from "@/components/ui/badge";
import { copy, fill, statusLabel } from "@/lib/copy";
import { hasWorkflow, REGION_META } from "@/lib/validations/item";

type TagOption = { id: string; name: string };

type ItemDetailViewProps = {
  item: {
    id: string;
    title: string;
    type: ItemType;
    status: string;
    content: string | null;
    url: string | null;
    archivedAt: Date | null;
    metadata: unknown;
    project?: { id: string; title: string } | null;
    tags: { tag: TagOption }[];
    relationsFrom: {
      id: string;
      target: { id: string; title: string; type: ItemType };
    }[];
    relationsTo: {
      id: string;
      source: { id: string; title: string; type: ItemType };
    }[];
  };
};

function readAuthor(metadata: unknown): string | null {
  if (
    typeof metadata === "object" &&
    metadata &&
    "author" in metadata &&
    typeof (metadata as { author?: unknown }).author === "string"
  ) {
    return (metadata as { author: string }).author;
  }
  return null;
}

export function ItemDetailView({ item }: ItemDetailViewProps) {
  const author = item.type === ItemType.BOOK ? readAuthor(item.metadata) : null;
  const hasRelations =
    item.relationsFrom.length > 0 || item.relationsTo.length > 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{REGION_META[item.type].label}</Badge>
        {hasWorkflow(item.type) ? (
          <Badge variant="outline">{statusLabel(item.status)}</Badge>
        ) : null}
        {item.archivedAt ? (
          <Badge variant="outline">{copy.items.archived}</Badge>
        ) : null}
      </div>

      {item.url ? (
        <div className="space-y-1">
          <p className="text-eyebrow text-muted-foreground">{copy.items.url}</p>
          <a
            href={item.url}
            target="_blank"
            rel="noreferrer"
            className="break-all text-ring hover:underline"
          >
            {item.url}
          </a>
        </div>
      ) : null}

      {author ? (
        <div className="space-y-1">
          <p className="text-eyebrow text-muted-foreground">
            {copy.items.author}
          </p>
          <p>{author}</p>
        </div>
      ) : null}

      {item.project ? (
        <div className="space-y-1">
          <p className="text-eyebrow text-muted-foreground">
            {copy.items.project}
          </p>
          <Link
            href={`/projects/${item.project.id}`}
            className="hover:underline"
          >
            {fill(copy.items.projectLabel, { title: item.project.title })}
          </Link>
        </div>
      ) : null}

      {item.content ? (
        <div className="space-y-2">
          <p className="text-eyebrow text-muted-foreground">
            {copy.items.content}
          </p>
          {item.type === ItemType.NOTE || item.type === ItemType.BOOK ? (
            <MarkdownContent content={item.content} />
          ) : (
            <div className="whitespace-pre-wrap text-sm leading-relaxed">
              {item.content}
            </div>
          )}
        </div>
      ) : null}

      {item.tags.length > 0 ? (
        <section className="space-y-3">
          <h2>{copy.tags.title}</h2>
          <div className="flex flex-wrap gap-2">
            {item.tags.map(({ tag }) => (
              <Badge key={tag.id} variant="secondary">
                #{tag.name}
              </Badge>
            ))}
          </div>
        </section>
      ) : null}

      {hasRelations ? (
        <section className="space-y-3">
          <h2>{copy.relations.title}</h2>
          <ul className="space-y-2">
            {item.relationsFrom.map((relation) => (
              <li
                key={relation.id}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                <Link
                  href={`/items/${relation.target.id}`}
                  className="hover:underline"
                >
                  → {relation.target.title} (
                  {REGION_META[relation.target.type].label})
                </Link>
              </li>
            ))}
            {item.relationsTo.map((relation) => (
              <li
                key={relation.id}
                className="rounded-lg border border-border px-3 py-2 text-sm"
              >
                <Link
                  href={`/items/${relation.source.id}`}
                  className="hover:underline"
                >
                  ← {relation.source.title} (
                  {REGION_META[relation.source.type].label})
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
