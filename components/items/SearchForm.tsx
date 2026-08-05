"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { copy } from "@/lib/copy";

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
        placeholder={copy.search.placeholder}
      />
      <Button type="submit" disabled={pending || !q.trim()}>
        {copy.search.submit}
      </Button>
    </form>
  );
}
