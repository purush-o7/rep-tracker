"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WorkoutImageCarousel } from "./workout-image-carousel";
import { LogWorkoutDialog } from "../../_components/log-workout-dialog";
import type { WorkoutWithTags } from "@/lib/types";

interface WorkoutDetailProps {
  workout: WorkoutWithTags;
}

export function WorkoutDetail({ workout }: WorkoutDetailProps) {
  const [logOpen, setLogOpen] = useState(false);

  return (
    <div className="space-y-6">
      <WorkoutImageCarousel images={workout.workout_images ?? []} />
      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{workout.name}</h1>
        <div className="flex flex-wrap gap-2">
          {workout.workout_tags.map((wt) => (
            <Badge key={wt.tag_id} variant="secondary">
              {wt.tags.name}
            </Badge>
          ))}
        </div>
        {workout.description && (
          <p className="text-muted-foreground">{workout.description}</p>
        )}
        <Button size="lg" className="w-full sm:w-auto" onClick={() => setLogOpen(true)}>
          Log This Workout
        </Button>
      </div>
      <LogWorkoutDialog
        workout={workout}
        open={logOpen}
        onOpenChange={setLogOpen}
      />
    </div>
  );
}
