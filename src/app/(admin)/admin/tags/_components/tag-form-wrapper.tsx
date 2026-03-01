"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TagForm } from "./tag-form";

export function TagFormWrapper() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Tag
      </Button>
      <TagForm open={open} onOpenChange={setOpen} />
    </>
  );
}
