"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchForm({ initialQuery = "" }: { initialQuery?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="flex flex-col gap-2 sm:flex-row"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(() => {
          const params = new URLSearchParams();
          if (q.trim()) params.set("q", q.trim());
          router.push(`/search?${params.toString()}`);
        });
      }}
    >
      <Input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search title or content…"
      />
      <Button type="submit" disabled={pending || !q.trim()}>
        Search
      </Button>
    </form>
  );
}
