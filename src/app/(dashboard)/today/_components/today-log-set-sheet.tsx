"use client";

import { useState } from "react";
import { Dumbbell, Plus, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveSheetDrawer } from "@/components/responsive-sheet-drawer";
import { SetInputRow } from "@/app/(dashboard)/workouts/_components/set-input-row";
import { LastSessionRef } from "@/components/last-session-ref";
import { logWorkoutFromPlan } from "../actions";
import { vibrate } from "@/lib/utils";
import type { DailyPlanItemWithWorkout, ExerciseTargets } from "@/lib/types";

interface TodayLogSetSheetProps {
  item: DailyPlanItemWithWorkout | null;
  targets?: ExerciseTargets | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SetData {
  reps: number;
  weight_kg: number;
}

function setsFromTargets(targets?: ExerciseTargets | null): SetData[] {
  if (!targets?.target_sets) return [{ reps: 0, weight_kg: 0 }];
  return Array.from({ length: targets.target_sets }, () => ({
    reps: targets.target_reps ?? 0,
    weight_kg: targets.target_weight_kg ?? 0,
  }));
}

export function TodayLogSetSheet({
  item,
  targets,
  open,
  onOpenChange,
}: TodayLogSetSheetProps) {
  const [sets, setSets] = useState<SetData[]>([{ reps: 0, weight_kg: 0 }]);
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  // Prefill from routine targets each time a new item is opened
  // (state adjustment during render — see react.dev "You Might Not Need an Effect")
  const [prefillKey, setPrefillKey] = useState<string | null>(null);
  const openKey = open ? (item?.id ?? null) : null;
  if (openKey !== prefillKey) {
    setPrefillKey(openKey);
    if (openKey) setSets(setsFromTargets(targets));
  }

  const logMutation = useMutation({
    mutationFn: (data: Parameters<typeof logWorkoutFromPlan>[0]) => logWorkoutFromPlan(data),
    onMutate: async (newLog) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: ["today-plan"] });

      // Snapshot the previous value
      const previousPlan = queryClient.getQueryData<DailyPlanItemWithWorkout[]>(["today-plan"]);

      // Optimistically update to the new value
      queryClient.setQueryData<DailyPlanItemWithWorkout[]>(["today-plan"], (old) => {
        if (!old) return [];
        return old.map((item) => {
          if (item.id === newLog.plan_item_id) {
            return {
              ...item,
              is_completed: true,
              workout_log_id: "optimistic-id", // Placeholder
            };
          }
          return item;
        });
      });

      return { previousPlan };
    },
    onError: (err, newLog, context) => {
      // Rollback on error
      if (context?.previousPlan) {
        queryClient.setQueryData(["today-plan"], context.previousPlan);
      }
      toast.error("Failed to save sets. Please try again.");
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
        // Let the settle handle the refetch to be safe
      } else {
        vibrate(50);
        toast.success("Sets logged!");
        onOpenChange(false);
        setSets([{ reps: 0, weight_kg: 0 }]);
        setNotes("");
      }
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: ["today-plan"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
    },
  });

  const addSet = () => setSets([...sets, { reps: 0, weight_kg: 0 }]);

  const removeSet = (index: number) =>
    setSets(sets.filter((_, i) => i !== index));

  const updateSet = (index: number, field: keyof SetData, value: number) => {
    const updated = [...sets];
    updated[index] = { ...updated[index], [field]: value };
    setSets(updated);
  };

  const handleSubmit = () => {
    if (!item) return;

    const validSets = sets.filter((s) => s.reps > 0);
    if (validSets.length === 0) {
      toast.error("Add at least one set with reps");
      return;
    }

    logMutation.mutate({
      plan_item_id: item.id,
      workout_id: item.workout_id,
      notes: notes || undefined,
      sets: validSets.map((s, i) => ({
        set_number: i + 1,
        reps: s.reps,
        weight_kg: s.weight_kg,
      })),
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSets([{ reps: 0, weight_kg: 0 }]);
      setNotes("");
    }
    onOpenChange(isOpen);
  };

  return (
    <ResponsiveSheetDrawer
      open={open}
      onOpenChange={handleOpenChange}
      title={item?.workouts.name ?? ""}
      description="Log your sets and reps"
      icon={<Dumbbell className="h-5 w-5 text-primary" />}
      footer={
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={logMutation.isPending}
        >
          {logMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Save Sets
            </>
          )}
        </Button>
      }
    >
      <div className="space-y-4">
        <LastSessionRef
          workoutId={item?.workout_id ?? null}
          enabled={open}
          onApply={(session) =>
            setSets(
              session.sets.map((s) => ({ reps: s.reps, weight_kg: s.weight_kg }))
            )
          }
        />
        {targets?.target_sets && (
          <p className="text-xs text-muted-foreground">
            Target: {targets.target_sets} sets
            {targets.target_reps ? ` × ${targets.target_reps} reps` : ""}
            {targets.target_weight_kg ? ` @ ${targets.target_weight_kg} kg` : ""}
          </p>
        )}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="grid grid-cols-[2rem_1fr_1fr_2rem] gap-2 text-xs font-medium text-muted-foreground mb-3 px-1">
            <span className="text-center">#</span>
            <span>Reps</span>
            <span>Weight (kg)</span>
            <span />
          </div>
          <div className="space-y-2">
            {sets.map((set, i) => (
              <SetInputRow
                key={i}
                index={i}
                reps={set.reps}
                weight={set.weight_kg}
                onRepsChange={(v) => updateSet(i, "reps", v)}
                onWeightChange={(v) => updateSet(i, "weight_kg", v)}
                onRemove={() => removeSet(i)}
                canRemove={sets.length > 1}
              />
            ))}
          </div>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={addSet}
          className="w-full border-dashed"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Set
        </Button>
        <Textarea
          placeholder="Notes (optional)"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
        />
        <p className="text-xs text-center text-muted-foreground">
          {sets.length} {sets.length === 1 ? "set" : "sets"} &middot; Sets with
          0 reps will be skipped
        </p>
      </div>
    </ResponsiveSheetDrawer>
  );
}
