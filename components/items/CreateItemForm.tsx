"use client";

import { ItemType } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

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
import { cn } from "@/lib/utils";
import {
  DEFAULT_STATUS,
  hasWorkflow,
  REGION_META,
  STATUS_OPTIONS,
} from "@/lib/validations/item";
import { createItem } from "@/server/items";

type ProjectOption = { id: string; title: string };

type CreateItemFormProps = {
  defaultType: ItemType;
  projects?: ProjectOption[];
  defaultProjectId?: string;
  embedded?: boolean;
  onCreated?: () => void;
};

export function CreateItemForm({
  defaultType,
  projects = [],
  defaultProjectId,
  embedded = false,
  onCreated,
}: CreateItemFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [type, setType] = useState<ItemType>(defaultType);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState(DEFAULT_STATUS[defaultType]);
  const [projectId, setProjectId] = useState<string>(defaultProjectId ?? "none");
  const [author, setAuthor] = useState("");
  const [error, setError] = useState<string | null>(null);

  function onTypeChange(value: ItemType) {
    setType(value);
    setStatus(DEFAULT_STATUS[value]);
  }

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    startTransition(async () => {
      try {
        setError(null);
        const item = await createItem({
          type,
          title,
          content: content || null,
          url: type === ItemType.LINK ? url : url || null,
          status: hasWorkflow(type) ? status : DEFAULT_STATUS[type],
          projectId: projectId === "none" ? null : projectId,
          metadata: type === ItemType.BOOK && author ? { author } : null,
        });
        setTitle("");
        setContent("");
        setUrl("");
        setAuthor("");
        onCreated?.();
        router.push(
          item.type === ItemType.PROJECT
            ? `/projects/${item.id}`
            : `/items/${item.id}`
        );
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : copy.items.createFailed);
      }
    });
  }

  return (
    <form
      onSubmit={onSubmit}
      className={cn(
        "space-y-4",
        !embedded && "rounded-lg border border-border bg-popover p-4"
      )}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>{copy.items.type}</Label>
          <Select value={type} onValueChange={(v) => onTypeChange(v as ItemType)}>
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
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {type === ItemType.LINK ? (
        <div className="space-y-2">
          <Label>{copy.items.url}</Label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            type="url"
            required
          />
        </div>
      ) : null}

      {type === ItemType.BOOK ? (
        <div className="space-y-2">
          <Label>{copy.items.author}</Label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
      ) : null}

      {type !== ItemType.PROJECT && projects.length > 0 ? (
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
          rows={5}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending || !title.trim()}>
        {pending ? copy.items.creating : copy.items.create}
      </Button>
    </form>
  );
}
