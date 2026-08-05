"use client";

import { ItemType } from "@prisma/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { copy, statusLabel } from "@/lib/copy";
import {
  DEFAULT_STATUS,
  hasWorkflow,
  isValidStatus,
  REGION_META,
  STATUS_OPTIONS,
} from "@/lib/validations/item";
import {
  archiveItem,
  deleteItem,
  restoreItem,
  updateItem,
} from "@/server/items";
import { createRelation, deleteRelation } from "@/server/relations";
import { assignTag, createTag, removeTag } from "@/server/tags";

type TagOption = { id: string; name: string };
type ProjectOption = { id: string; title: string };
type Relatable = { id: string; title: string; type: ItemType };

type ItemDetail = {
  id: string;
  title: string;
  type: ItemType;
  status: string;
  content: string | null;
  url: string | null;
  projectId: string | null;
  archivedAt: Date | null;
  metadata: unknown;
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

type ItemDetailFormProps = {
  item: ItemDetail;
  tags: TagOption[];
  projects: ProjectOption[];
  relatableItems: Relatable[];
};

export function ItemDetailForm({
  item,
  tags,
  projects,
  relatableItems,
}: ItemDetailFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [title, setTitle] = useState(item.title);
  const [type, setType] = useState(item.type);
  const [status, setStatus] = useState(
    isValidStatus(item.type, item.status)
      ? item.status
      : DEFAULT_STATUS[item.type]
  );
  const [content, setContent] = useState(item.content ?? "");
  const [url, setUrl] = useState(item.url ?? "");
  const [projectId, setProjectId] = useState(item.projectId ?? "none");
  const [author, setAuthor] = useState(
    typeof item.metadata === "object" &&
      item.metadata &&
      "author" in item.metadata &&
      typeof (item.metadata as { author?: unknown }).author === "string"
      ? (item.metadata as { author: string }).author
      : ""
  );
  const [newTag, setNewTag] = useState("");
  const [tagId, setTagId] = useState("none");
  const [targetId, setTargetId] = useState("none");
  const [error, setError] = useState<string | null>(null);

  const assignedTagIds = useMemo(
    () => new Set(item.tags.map((entry) => entry.tag.id)),
    [item.tags]
  );

  function run(action: () => Promise<unknown>) {
    startTransition(async () => {
      try {
        setError(null);
        await action();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : copy.items.actionFailed);
      }
    });
  }

  return (
    <div className="space-y-8">
      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          run(async () => {
            await updateItem({
              id: item.id,
              title,
              type,
              status: hasWorkflow(type) ? status : DEFAULT_STATUS[type],
              content,
              url: url || null,
              projectId: projectId === "none" ? null : projectId,
              metadata: type === ItemType.BOOK ? { author } : null,
            });
            router.push(`/items/${item.id}`);
          });
        }}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>{copy.items.type}</Label>
            <Select
              value={type}
              onValueChange={(v) => {
                const next = v as ItemType;
                setType(next);
                setStatus(DEFAULT_STATUS[next]);
              }}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.values(ItemType).map((value) => (
                  <SelectItem key={value} value={value}>
                    {REGION_META[value].label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {hasWorkflow(type) ? (
            <div className="space-y-2">
              <Label>{copy.items.status}</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS[type].map((value) => (
                    <SelectItem key={value} value={value}>
                      {statusLabel(value)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : null}
        </div>

        <div className="space-y-2">
          <Label>{copy.items.title}</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>

        <div className="space-y-2">
          <Label>{copy.items.url}</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} />
        </div>

        {type === ItemType.BOOK ? (
          <div className="space-y-2">
            <Label>{copy.items.author}</Label>
            <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
          </div>
        ) : null}

        {type !== ItemType.PROJECT ? (
          <div className="space-y-2">
            <Label>{copy.items.project}</Label>
            <Select value={projectId} onValueChange={setProjectId}>
              <SelectTrigger>
                <SelectValue placeholder={copy.items.none} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">{copy.items.none}</SelectItem>
                {projects.map((project) => (
                  <SelectItem key={project.id} value={project.id}>
                    {project.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : null}

        <div className="space-y-2">
          <Label>{copy.items.content}</Label>
          <Textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={10}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={pending}>
            {copy.items.save}
          </Button>
          {item.archivedAt ? (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => restoreItem(item.id))}
            >
              {copy.items.restore}
            </Button>
          ) : (
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => run(() => archiveItem(item.id))}
            >
              {copy.items.archive}
            </Button>
          )}
          <Button
            type="button"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              run(async () => {
                await deleteItem(item.id);
                router.push("/");
              })
            }
          >
            {copy.items.delete}
          </Button>
        </div>
      </form>

      <section className="space-y-3">
        <h2>{copy.tags.title}</h2>
        <div className="flex flex-wrap gap-2">
          {item.tags.map(({ tag }) => (
            <button
              key={tag.id}
              type="button"
              className="disabled:opacity-50"
              disabled={pending}
              onClick={() =>
                run(() => removeTag({ itemId: item.id, tagId: tag.id }))
              }
            >
              <Badge variant="secondary">#{tag.name} ×</Badge>
            </button>
          ))}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={tagId} onValueChange={setTagId}>
            <SelectTrigger className="sm:max-w-xs">
              <SelectValue placeholder={copy.tags.assignExisting} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{copy.tags.selectTag}</SelectItem>
              {tags
                .filter((tag) => !assignedTagIds.has(tag.id))
                .map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            disabled={pending || tagId === "none"}
            onClick={() => run(() => assignTag({ itemId: item.id, tagId }))}
          >
            {copy.tags.assign}
          </Button>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder={copy.tags.newTag}
            className="sm:max-w-xs"
          />
          <Button
            type="button"
            variant="outline"
            disabled={pending || !newTag.trim()}
            onClick={() =>
              run(async () => {
                const tag = await createTag({ name: newTag.trim() });
                await assignTag({ itemId: item.id, tagId: tag.id });
                setNewTag("");
              })
            }
          >
            {copy.tags.createAndAssign}
          </Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2>{copy.relations.title}</h2>
        <ul className="space-y-2">
          {item.relationsFrom.map((relation) => (
            <li
              key={relation.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <Link
                href={`/items/${relation.target.id}`}
                className="hover:underline"
              >
                → {relation.target.title} (
                {REGION_META[relation.target.type].label})
              </Link>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => run(() => deleteRelation(relation.id))}
              >
                {copy.relations.remove}
              </Button>
            </li>
          ))}
          {item.relationsTo.map((relation) => (
            <li
              key={relation.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
            >
              <Link
                href={`/items/${relation.source.id}`}
                className="hover:underline"
              >
                ← {relation.source.title} (
                {REGION_META[relation.source.type].label})
              </Link>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={pending}
                onClick={() => run(() => deleteRelation(relation.id))}
              >
                {copy.relations.remove}
              </Button>
            </li>
          ))}
        </ul>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger>
              <SelectValue placeholder={copy.relations.relateTo} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">{copy.relations.selectItem}</SelectItem>
              {relatableItems
                .filter((candidate) => candidate.id !== item.id)
                .map((candidate) => (
                  <SelectItem key={candidate.id} value={candidate.id}>
                    {candidate.title} ({REGION_META[candidate.type].label})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
          <Button
            type="button"
            variant="outline"
            disabled={pending || targetId === "none"}
            onClick={() =>
              run(() => createRelation({ sourceId: item.id, targetId }))
            }
          >
            {copy.relations.link}
          </Button>
        </div>
      </section>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
