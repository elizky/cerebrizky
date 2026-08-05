"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copy } from "@/lib/copy";
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
    <motion.form
      onSubmit={onSubmit}
      layout
      className="flex w-full flex-col gap-2 sm:flex-row sm:items-center"
    >
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={copy.shell.capturePlaceholder}
        className="bg-popover"
        disabled={pending}
      />
      <Button type="submit" disabled={pending || !title.trim()}>
        {pending ? copy.shell.saving : copy.shell.capture}
      </Button>
      {error ? <p className="text-sm text-destructive">{error}</p> : null}
    </motion.form>
  );
}
