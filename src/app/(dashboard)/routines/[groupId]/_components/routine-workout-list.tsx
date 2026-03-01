"use client";

import { useState } from "react";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogSetSheet } from "./log-set-sheet";
import type { Workout, WorkoutGroupItem } from "@/lib/types";

interface RoutineWorkoutListProps {
  items: (WorkoutGroupItem & { workouts: Workout })[];
}

export function RoutineWorkoutList({ items }: RoutineWorkoutListProps) {
  const [logWorkout, setLogWorkout] = useState<Workout | null>(null);

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
        {sorted.map((item, i) => (
          <Card key={item.id}>
            <CardContent className="flex items-center gap-3 p-3">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                {i + 1}
              </span>
              <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="flex-1 truncate font-medium">
                {item.workouts.name}
              </span>
              <Button
                size="sm"
                onClick={() => setLogWorkout(item.workouts)}
              >
                Log Sets
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <LogSetSheet
        workout={logWorkout}
        open={!!logWorkout}
        onOpenChange={(open) => {
          if (!open) setLogWorkout(null);
        }}
      />
    </>
  );
}
