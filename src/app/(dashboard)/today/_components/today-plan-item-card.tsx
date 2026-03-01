"use client";

import Link from "next/link";
import { CheckCircle2, X, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { removeFromPlan } from "../actions";
import type { DailyPlanItemWithWorkout } from "@/lib/types";

interface TodayPlanItemCardProps {
  item: DailyPlanItemWithWorkout;
  index: number;
  onLogSets: (item: DailyPlanItemWithWorkout) => void;
}

export function TodayPlanItemCard({
  item,
  index,
  onLogSets,
}: TodayPlanItemCardProps) {
  const handleRemove = async () => {
    const result = await removeFromPlan(item.id);
    if (result.error) {
      toast.error(result.error);
    }
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-lg border p-3 transition-colors ${
        item.is_completed
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

      {/* Workout name */}
      <div className="min-w-0 flex-1">
        <Link
          href={`/workouts/${item.workout_id}`}
          className="text-sm font-medium hover:underline truncate block"
        >
          {item.workouts.name}
        </Link>
      </div>

      {/* Action buttons */}
      <div className="flex items-center gap-1 shrink-0">
        {item.is_completed ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2.5 py-1 text-xs font-medium text-green-600 dark:text-green-400">
            <CheckCircle2 className="h-3 w-3" />
            Done
          </span>
        ) : (
          <Button size="sm" variant="outline" onClick={() => onLogSets(item)}>
            <Dumbbell className="mr-1.5 h-3.5 w-3.5" />
            Log Sets
          </Button>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-muted-foreground hover:text-destructive"
          onClick={handleRemove}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
