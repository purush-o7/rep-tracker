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
import { PlateCalculator } from "@/components/plate-calculator";
import { EquipmentNote } from "@/components/equipment-note";
import { logWorkoutFromPlan } from "../actions";
import { vibrate } from "@/lib/utils";
import {
  emptySet,
  fromLoggedSet,
  toSetInputs,
  type SetEntry,
} from "@/lib/set-entry";
import type { DailyPlanItemWithWorkout, ExerciseTargets } from "@/lib/types";

interface TodayLogSetSheetProps {
  item: DailyPlanItemWithWorkout | null;
  targets?: ExerciseTargets | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  viewingUserId: string;
  forUserId?: string;
}

function setsFromTargets(targets?: ExerciseTargets | null): SetEntry[] {
  if (!targets?.target_sets) return [emptySet()];
  return Array.from({ length: targets.target_sets }, () => ({
    ...emptySet(),
    reps: targets.target_reps ?? 0,
    weight_kg: targets.target_weight_kg ?? 0,
  }));
}

export function TodayLogSetSheet({
  item,
  targets,
  open,
  onOpenChange,
  viewingUserId,
  forUserId,
}: TodayLogSetSheetProps) {
  const [sets, setSets] = useState<SetEntry[]>([emptySet()]);
  const [notes, setNotes] = useState("");
  const queryClient = useQueryClient();

  const planKey = ["today-plan", viewingUserId];
  const logType = item?.workouts.log_type ?? "weight_reps";

  // Prefill from routine targets each time a new item is opened
  // (state adjustment during render — see react.dev "You Might Not Need an Effect")
  const [prefillKey, setPrefillKey] = useState<string | null>(null);
  const openKey = open ? (item?.id ?? null) : null;
  if (openKey !== prefillKey) {
    setPrefillKey(openKey);
    if (openKey) {
      setSets(logType === "weight_reps" ? setsFromTargets(targets) : [emptySet()]);
    }
  }

  const logMutation = useMutation({
    mutationFn: (data: Parameters<typeof logWorkoutFromPlan>[0]) => logWorkoutFromPlan(data),
    onMutate: async (newLog) => {
      await queryClient.cancelQueries({ queryKey: planKey });
      const previousPlan = queryClient.getQueryData<DailyPlanItemWithWorkout[]>(planKey);
      queryClient.setQueryData<DailyPlanItemWithWorkout[]>(planKey, (old) => {
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
      if (context?.previousPlan) {
        queryClient.setQueryData(planKey, context.previousPlan);
      }
      toast.error("Failed to save sets. Please try again.");
    },
    onSuccess: (result) => {
      if (result.error) {
        toast.error(result.error);
      } else {
        vibrate(50);
        if ("pr" in result && result.pr) {
          vibrate([50, 50, 100]);
          toast.success(
            result.pr.type === "weight"
              ? `🏆 New PR! ${result.pr.value} kg (was ${result.pr.previous} kg)`
              : `🏆 Rep PR! ${result.pr.value} reps at top weight (was ${result.pr.previous})`,
            { duration: 6000 }
          );
        } else {
          toast.success("Sets logged!");
        }
        onOpenChange(false);
        setSets([emptySet()]);
        setNotes("");
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: planKey });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
      queryClient.invalidateQueries({ queryKey: ["last-session", item?.workout_id] });
    },
  });

  const addSet = () => setSets((prev) => [...prev, emptySet()]);

  const removeSet = (index: number) =>
    setSets((prev) => prev.filter((_, i) => i !== index));

  const updateSet = (index: number, patch: Partial<SetEntry>) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const handleSubmit = () => {
    if (!item) return;

    const validSets = toSetInputs(sets, logType);
    if (validSets.length === 0) {
      toast.error("Add at least one completed set");
      return;
    }

    logMutation.mutate({
      plan_item_id: item.id,
      workout_id: item.workout_id,
      notes: notes || undefined,
      sets: validSets,
      for_user_id: forUserId,
    });
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSets([emptySet()]);
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
        <EquipmentNote workoutId={item?.workout_id ?? null} enabled={open} />
        <LastSessionRef
          workoutId={item?.workout_id ?? null}
          enabled={open}
          onApply={(session) => setSets(session.sets.map(fromLoggedSet))}
        />
        {logType === "weight_reps" && targets?.target_sets && (
          <p className="text-xs text-muted-foreground">
            Target: {targets.target_sets} sets
            {targets.target_reps ? ` × ${targets.target_reps} reps` : ""}
            {targets.target_weight_kg ? ` @ ${targets.target_weight_kg} kg` : ""}
          </p>
        )}
        <div className="rounded-lg border bg-muted/30 p-3">
          <div className="mb-3 flex items-center justify-between px-1 text-xs font-medium text-muted-foreground">
            <span>
              {logType === "weight_reps" && "Set · Reps · Weight (kg)"}
              {logType === "duration" && "Set · Duration"}
              {logType === "distance" && "Set · Distance"}
            </span>
            {logType === "weight_reps" && (
              <PlateCalculator
                initialWeight={sets.find((s) => s.weight_kg > 0)?.weight_kg}
              />
            )}
          </div>
          <div className="space-y-2">
            {sets.map((set, i) => (
              <SetInputRow
                key={i}
                index={i}
                logType={logType}
                entry={set}
                onChange={(patch) => updateSet(i, patch)}
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
          {sets.length} {sets.length === 1 ? "set" : "sets"} &middot; Empty sets
          will be skipped
        </p>
      </div>
    </ResponsiveSheetDrawer>
  );
}
