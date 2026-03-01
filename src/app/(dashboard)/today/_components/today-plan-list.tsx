"use client";

import { useState } from "react";
import { Plus, CalendarCheck, Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { TodayPlanItemCard } from "./today-plan-item-card";
import { AddWorkoutSheet } from "./add-workout-sheet";
import { TodayLogSetSheet } from "./today-log-set-sheet";
import type { DailyPlanItemWithWorkout, Workout, WorkoutGroup } from "@/lib/types";

interface TodayPlanListProps {
  planItems: DailyPlanItemWithWorkout[];
  routines: (WorkoutGroup & { workout_group_items: { count: number }[] })[];
  workouts: Pick<Workout, "id" | "name">[];
}

export function TodayPlanList({
  planItems,
  routines,
  workouts,
}: TodayPlanListProps) {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DailyPlanItemWithWorkout | null>(null);

  const completedCount = planItems.filter((i) => i.is_completed).length;
  const totalCount = planItems.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleLogSets = (item: DailyPlanItemWithWorkout) => {
    setSelectedItem(item);
    setLogSheetOpen(true);
  };

  if (planItems.length === 0) {
    return (
      <>
        <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Dumbbell className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No workouts planned</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add workouts from a routine or pick individual exercises to get started
            </p>
          </div>
          <Button onClick={() => setAddSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Workout
          </Button>
        </div>

        <AddWorkoutSheet
          open={addSheetOpen}
          onOpenChange={setAddSheetOpen}
          routines={routines}
          workouts={workouts}
        />
      </>
    );
  }

  return (
    <>
      {/* Progress bar */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarCheck className="h-4 w-4" />
            <span>
              {completedCount} of {totalCount} completed
            </span>
          </div>
          {completedCount === totalCount && totalCount > 0 && (
            <span className="text-sm font-medium text-green-600 dark:text-green-400">
              All done!
            </span>
          )}
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Plan items */}
      <div className="space-y-2">
        {planItems.map((item, index) => (
          <TodayPlanItemCard
            key={item.id}
            item={item}
            index={index}
            onLogSets={handleLogSets}
          />
        ))}
      </div>

      {/* Add more button */}
      <Button
        variant="outline"
        className="w-full border-dashed"
        onClick={() => setAddSheetOpen(true)}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Workout
      </Button>

      {/* Sheets */}
      <AddWorkoutSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        routines={routines}
        workouts={workouts}
      />
      <TodayLogSetSheet
        item={selectedItem}
        open={logSheetOpen}
        onOpenChange={setLogSheetOpen}
      />
    </>
  );
}
