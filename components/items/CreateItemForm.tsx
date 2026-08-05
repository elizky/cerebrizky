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
import { DEFAULT_STATUS } from "@/lib/validations/item";
import { createItem } from "@/server/items";

type ProjectOption = { id: string; title: string };

type CreateItemFormProps = {
  defaultType: ItemType;
  projects?: ProjectOption[];
  defaultProjectId?: string;
};

export function CreateItemForm({
  defaultType,
  projects = [],
  defaultProjectId,
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
          status,
          projectId: projectId === "none" ? null : projectId,
          metadata:
            type === ItemType.BOOK && author
              ? { author }
              : null,
        });
        setTitle("");
        setContent("");
        setUrl("");
        setAuthor("");
        router.push(
          item.type === ItemType.PROJECT
            ? `/projects/${item.id}`
            : `/items/${item.id}`
        );
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Create failed");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4 rounded-lg border border-border bg-popover p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Type</Label>
          <Select value={type} onValueChange={(v) => onTypeChange(v as ItemType)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.values(ItemType).map((value) => (
                <SelectItem key={value} value={value}>
                  {value}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Input value={status} onChange={(e) => setStatus(e.target.value)} />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Title</Label>
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>

      {type === ItemType.LINK ? (
        <div className="space-y-2">
          <Label>URL</Label>
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
          <Label>Author</Label>
          <Input value={author} onChange={(e) => setAuthor(e.target.value)} />
        </div>
      ) : null}

      {type !== ItemType.PROJECT && projects.length > 0 ? (
        <div className="space-y-2">
          <Label>Project</Label>
          <Select value={projectId} onValueChange={setProjectId}>
            <SelectTrigger>
              <SelectValue placeholder="None" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
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
        <Label>Content</Label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
        />
      </div>

      {error ? <p className="text-sm text-destructive">{error}</p> : null}
      <Button type="submit" disabled={pending || !title.trim()}>
        {pending ? "Creating…" : "Create"}
      </Button>
    </form>
  );
}
