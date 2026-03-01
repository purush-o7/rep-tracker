"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkoutForm } from "./workout-form";
import type { Tag } from "@/lib/types";

export function WorkoutFormWrapper({ tags }: { tags: Tag[] }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Add Workout
      </Button>
      <WorkoutForm open={open} onOpenChange={setOpen} tags={tags} />
    </>
  );
}
