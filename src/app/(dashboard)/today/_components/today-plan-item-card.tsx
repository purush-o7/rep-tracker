"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, X, Dumbbell, Loader2, Pencil } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { MuscleTags } from "@/components/muscle-tags";
import { SchemeTag } from "@/components/scheme-tag";
import { WorkoutQuickView } from "@/components/workout-quick-view";
import { removeFromPlan } from "../actions";
import type { DailyPlanItemWithWorkout } from "@/lib/types";

interface TodayPlanItemCardProps {
  item: DailyPlanItemWithWorkout;
  index: number;
  viewingUserId: string;
  forUserId?: string;
  canLog?: boolean;
  canRemove?: boolean;
  /** Sets actually logged (completed items) */
  setCount?: number;
}

export function TodayPlanItemCard({
  item,
  index,
  viewingUserId,
  forUserId,
  canLog = true,
  canRemove = true,
  setCount = 0,
}: TodayPlanItemCardProps) {
  const queryClient = useQueryClient();
  const planKey = ["today-plan", viewingUserId];
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  const removeMutation = useMutation({
    mutationFn: (id: string) => removeFromPlan(id, forUserId),
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: planKey });
      const previousPlan =
        queryClient.getQueryData<DailyPlanItemWithWorkout[]>(planKey);
      queryClient.setQueryData<DailyPlanItemWithWorkout[]>(planKey, (old) => {
        if (!old) return [];
        return old.filter((item) => item.id !== deletedId);
      });
      return { previousPlan };
    },
    onError: (err, newLog, context) => {
      if (context?.previousPlan) {
        queryClient.setQueryData(planKey, context.previousPlan);
      }
      toast.error("Failed to remove item.");
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: planKey });
    },
  });

  const handleRemove = () => {
    removeMutation.mutate(item.id);
  };

  const isPending = removeMutation.isPending;

  // Bottom-edge set bar: only shown once the workout is started (sets logged)
  const completed = item.is_completed && setCount > 0;
  const segmentCount = completed ? setCount : 0;

  return (
    <div
      className={`relative overflow-hidden flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        isPending
          ? "opacity-40 pointer-events-none"
          : item.is_completed
            ? "opacity-60 bg-muted/30 border-green-500/20"
            : "bg-card"
      }`}
    >
      {/* Number / Check indicator */}
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border">
        {item.is_completed ? (
          <CheckCircle2 className="h-5 w-5 text-green-500" />
        ) : (
          <span className="text-sm font-medium text-muted-foreground">
            {index + 1}
          </span>
        )}
      </div>

      {/* Workout name — opens a quick preview */}
      <div className="min-w-0 flex-1">
        <button
          type="button"
          onClick={() => setQuickViewOpen(true)}
          className="block max-w-full truncate text-left text-sm font-medium hover:underline"
        >
          {item.workouts.name}
        </button>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
          <MuscleTags tags={item.workouts.workout_tags} max={3} />
          <SchemeTag
            sets={item.workouts.default_sets}
            reps={item.workouts.default_reps}
          />
        </div>
      </div>

      {/* Action buttons — completed items stay editable (no terminal "done" state) */}
      <div className="flex items-center gap-1 shrink-0">
        {canLog &&
          (item.is_completed ? (
            <Button
              asChild
              size="sm"
              variant="ghost"
              className="text-green-600 hover:text-green-700 dark:text-green-400"
            >
              <Link href={`/today/log/${item.id}`}>
                <Pencil className="mr-1.5 h-3.5 w-3.5" />
                Edit
              </Link>
            </Button>
          ) : (
            <Button asChild size="sm" variant="outline">
              <Link href={`/today/log/${item.id}`}>
                <Dumbbell className="mr-1.5 h-3.5 w-3.5" />
                Log Sets
              </Link>
            </Button>
          ))}
        {canRemove && (
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-muted-foreground hover:text-destructive"
            onClick={handleRemove}
            disabled={isPending}
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <X className="h-4 w-4" />
            )}
          </Button>
        )}
      </div>

      {/* Bottom-edge set bar (only once started): full width split into one
          segment per logged set, alternating two theme colors. */}
      {segmentCount > 0 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-1 gap-0.5 px-0.5">
          {Array.from({ length: segmentCount }).map((_, i) => (
            <div
              key={i}
              className="h-full flex-1 rounded-full"
              style={{
                backgroundColor:
                  i % 2 === 0 ? "var(--chart-1)" : "var(--chart-2)",
              }}
            />
          ))}
        </div>
      )}

      <WorkoutQuickView
        workout={item.workouts}
        open={quickViewOpen}
        onOpenChange={setQuickViewOpen}
      />
    </div>
  );
}
