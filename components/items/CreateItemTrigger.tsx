"use client";

import { ItemType } from "@prisma/client";
import { useState } from "react";

import { CreateItemForm } from "@/components/items/CreateItemForm";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { copy } from "@/lib/copy";

type ProjectOption = { id: string; title: string };

type CreateItemTriggerProps = {
  defaultType: ItemType;
  projects?: ProjectOption[];
  defaultProjectId?: string;
};

export function CreateItemTrigger({
  defaultType,
  projects,
  defaultProjectId,
}: CreateItemTriggerProps) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        {copy.items.create}
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title={copy.items.createTitle}
      >
        <CreateItemForm
          defaultType={defaultType}
          projects={projects}
          defaultProjectId={defaultProjectId}
          embedded
          onCreated={() => setOpen(false)}
        />
      </Dialog>
    </>
  );
}
