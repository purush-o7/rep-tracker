"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogSetSheet } from "./log-set-sheet";
import { MuscleTags } from "@/components/muscle-tags";
import { SchemeTag } from "@/components/scheme-tag";
import type { TaggedWorkout, WorkoutGroupItem } from "@/lib/types";

interface RoutineWorkoutListProps {
  items: (WorkoutGroupItem & { workouts: TaggedWorkout })[];
}

function formatTargets(item: WorkoutGroupItem) {
  if (!item.target_sets && !item.target_reps && !item.target_weight_kg)
    return null;
  const parts: string[] = [];
  if (item.target_sets) parts.push(`${item.target_sets} sets`);
  if (item.target_reps) parts.push(`× ${item.target_reps} reps`);
  if (item.target_weight_kg) parts.push(`@ ${item.target_weight_kg} kg`);
  return parts.join(" ");
}

export function RoutineWorkoutList({ items }: RoutineWorkoutListProps) {
  const [logItem, setLogItem] = useState<
    (WorkoutGroupItem & { workouts: TaggedWorkout }) | null
  >(null);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-muted-foreground">
        <Dumbbell className="h-8 w-8 mb-2" />
        <p className="text-sm">No workouts in this routine yet.</p>
      </div>
    );
  }

  const sorted = [...items].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <>
      <div className="space-y-2">
        {sorted.map((item, i) => {
          const targets = formatTargets(item);
          return (
            <Card key={item.id}>
              <CardContent className="flex items-center gap-3 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                  {i + 1}
                </span>
                <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <span className="block truncate font-medium">
                    {item.workouts.name}
                  </span>
                  {targets ? (
                    <span className="block text-xs text-muted-foreground">
                      {targets}
                    </span>
                  ) : (
                    <SchemeTag
                      sets={item.workouts.default_sets}
                      reps={item.workouts.default_reps}
                      className="mt-0.5"
                    />
                  )}
                  <MuscleTags
                    tags={item.workouts.workout_tags}
                    max={3}
                    className="mt-0.5"
                  />
                </div>
                <Button size="sm" onClick={() => setLogItem(item)}>
                  Log Sets
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <LogSetSheet
        workout={logItem?.workouts ?? null}
        targets={logItem}
        open={!!logItem}
        onOpenChange={(open) => {
          if (!open) setLogItem(null);
        }}
      />
    </>
  );
}
