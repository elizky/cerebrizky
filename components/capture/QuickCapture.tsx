"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Input } from "@/components/ui/input";
import { copy } from "@/lib/copy";
import { cn } from "@/lib/utils";
import { quickCapture } from "@/server/items";

export function QuickCapture() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    startTransition(async () => {
      try {
        setError(null);
        await quickCapture({ title: title.trim() });
        setTitle("");
        router.refresh();
      } catch {
        setError(copy.shell.captureError);
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="w-full">
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={pending ? copy.shell.saving : copy.shell.capturePlaceholder}
        disabled={pending}
        className={cn(
          "h-9 rounded-md border-border/40 bg-transparent shadow-none",
          "placeholder:text-muted-foreground/70",
          "focus-visible:border-primary/50 focus-visible:ring-0 focus-visible:ring-offset-0",
          pending && "opacity-70"
        )}
        aria-label={copy.shell.capturePlaceholder}
      />
      {error ? (
        <p className="mt-1 text-xs text-destructive">{error}</p>
      ) : null}
    </form>
  );
}
