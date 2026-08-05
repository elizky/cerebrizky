"use client";

import { ItemType } from "@prisma/client";
import { GripVertical, LoaderCircle, Pencil } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Badge } from "@/components/ui/badge";
import { copy, statusLabel } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { STATUS_OPTIONS } from "@/lib/validations/item";
import { updateItem } from "@/server/items";

type BoardItem = {
  id: string;
  title: string;
  status: string;
  content: string | null;
  url: string | null;
  tags?: { tag: { name: string } }[];
  project?: { id: string; title: string } | null;
};

type StatusBoardProps = {
  type: ItemType;
  items: BoardItem[];
};

type MoveState = {
  id: string;
  toStatus: string;
};

export function StatusBoard({ type, items }: StatusBoardProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overStatus, setOverStatus] = useState<string | null>(null);
  const [moving, setMoving] = useState<MoveState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const statuses = STATUS_OPTIONS[type];

  const displayItems = items.map((item) =>
    moving && item.id === moving.id
      ? { ...item, status: moving.toStatus }
      : item
  );

  function move(id: string, status: string) {
    const current = items.find((item) => item.id === id);
    if (!current || current.status === status) {
      setDraggingId(null);
      setOverStatus(null);
      return;
    }

    setMoving({ id, toStatus: status });
    setDraggingId(null);
    setOverStatus(null);

    startTransition(async () => {
      try {
        setError(null);
        await updateItem({ id, status });
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : copy.items.actionFailed);
      } finally {
        setMoving(null);
      }
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{copy.items.dragHint}</p>
      <div
        className={cn(
          "grid gap-4 md:grid-cols-3",
          pending && "pointer-events-none"
        )}
        aria-busy={pending}
      >
        {statuses.map((status) => {
          const columnItems = displayItems.filter((item) => {
            if (item.status === status) return true;
            if (!statuses.includes(item.status) && status === statuses[0]) {
              return true;
            }
            return false;
          });
          const isOver =
            overStatus === status && draggingId !== null && !moving;

          return (
            <section
              key={status}
              onDragOver={(event) => {
                if (moving) return;
                event.preventDefault();
                event.dataTransfer.dropEffect = "move";
                if (overStatus !== status) setOverStatus(status);
              }}
              onDragLeave={(event) => {
                const next = event.relatedTarget as Node | null;
                if (next && event.currentTarget.contains(next)) return;
                if (overStatus === status) setOverStatus(null);
              }}
              onDrop={(event) => {
                event.preventDefault();
                const id = event.dataTransfer.getData("text/plain");
                setOverStatus(null);
                if (id) move(id, status);
              }}
              className={cn(
                "flex min-h-56 flex-col rounded-lg border border-dashed p-3 transition",
                isOver
                  ? "border-primary bg-primary/10 shadow-[inset_0_0_0_1px] shadow-primary/40"
                  : "border-border bg-muted/30"
              )}
            >
              <header className="mb-3 flex items-center justify-between gap-2">
                <h2 className="text-base">{statusLabel(status)}</h2>
                <Badge variant="outline">{columnItems.length}</Badge>
              </header>
              <ul className="flex flex-1 flex-col gap-2">
                {columnItems.map((item) => {
                  const isDragging = draggingId === item.id;
                  const isMoving = moving?.id === item.id;

                  return (
                    <li
                      key={item.id}
                      draggable={!pending && !isMoving}
                      onDragStart={(event) => {
                        event.dataTransfer.setData("text/plain", item.id);
                        event.dataTransfer.effectAllowed = "move";
                        setDraggingId(item.id);
                      }}
                      onDragEnd={() => {
                        if (!moving) {
                          setDraggingId(null);
                          setOverStatus(null);
                        }
                      }}
                      className={cn(
                        "group relative rounded-lg border border-border bg-popover shadow-sm transition",
                        !isMoving && "cursor-grab active:cursor-grabbing",
                        isDragging &&
                          "scale-[0.98] opacity-40 ring-2 ring-primary/50",
                        isMoving && "border-primary/50 bg-accent/40"
                      )}
                    >
                      <div className="flex items-stretch">
                        <div
                          className="flex items-center px-1.5 text-muted-foreground transition group-hover:text-foreground"
                          aria-hidden
                        >
                          {isMoving ? (
                            <LoaderCircle className="h-4 w-4 animate-spin text-primary" />
                          ) : (
                            <GripVertical className="h-4 w-4" />
                          )}
                        </div>
                        <Link
                          href={`/items/${item.id}`}
                          className="min-w-0 flex-1 py-2.5 pr-9 hover:bg-accent/30"
                          draggable={false}
                          onClick={(event) => {
                            if (draggingId || isMoving) event.preventDefault();
                          }}
                        >
                          <h3 className="text-sm">{item.title}</h3>
                          {isMoving ? (
                            <p className="mt-1 text-xs text-primary">
                              {copy.items.moving}
                            </p>
                          ) : null}
                          {!isMoving && item.content ? (
                            <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                              {item.content}
                            </p>
                          ) : null}
                          {!isMoving && item.url ? (
                            <p className="mt-1 truncate text-xs text-ring">
                              {item.url}
                            </p>
                          ) : null}
                          {!isMoving && item.tags && item.tags.length > 0 ? (
                            <div className="mt-2 flex flex-wrap gap-1">
                              {item.tags.map(({ tag }) => (
                                <Badge key={tag.name} variant="secondary">
                                  #{tag.name}
                                </Badge>
                              ))}
                            </div>
                          ) : null}
                        </Link>
                        {!isMoving ? (
                          <Link
                            href={`/items/${item.id}?edit=1`}
                            aria-label={copy.items.editItem}
                            title={copy.items.edit}
                            draggable={false}
                            className="absolute right-1.5 top-1.5 inline-flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
                {columnItems.length === 0 || isOver ? (
                  <li
                    className={cn(
                      "flex flex-1 items-center justify-center rounded-md border border-dashed px-3 py-6 text-center text-xs transition",
                      isOver
                        ? "border-primary/60 text-primary"
                        : "border-transparent text-muted-foreground/70"
                    )}
                  >
                    {isOver ? copy.items.dropHere : null}
                  </li>
                ) : null}
              </ul>
            </section>
          );
        })}
      </div>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
