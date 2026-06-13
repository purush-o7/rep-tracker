"use client";

import { useState } from "react";
import { Dumbbell, Plus, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveSheetDrawer } from "@/components/responsive-sheet-drawer";
import { SetInputRow } from "@/app/(dashboard)/workouts/_components/set-input-row";
import { LastSessionRef } from "@/components/last-session-ref";
import { PlateCalculator } from "@/components/plate-calculator";
import { EquipmentNote } from "@/components/equipment-note";
import { SchemeTag } from "@/components/scheme-tag";
import { logWorkoutFromPlan } from "../actions";
import { updateLog } from "@/app/(dashboard)/workouts/actions";
import { createClient } from "@/lib/supabase/client";
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
  const supabase = createClient();

  const planKey = ["today-plan", viewingUserId];
  const logType = item?.workouts.log_type ?? "weight_reps";

  // Editing an already-logged item (no terminal "done" state — always editable)
  const editingLogId =
    open &&
    item?.is_completed &&
    item.workout_log_id &&
    item.workout_log_id !== "optimistic-id"
      ? item.workout_log_id
      : null;
  const isEditing = !!editingLogId;

  // Load the existing log when editing, to prefill the form
  const { data: existingLog } = useQuery({
    queryKey: ["log-detail", editingLogId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("workout_logs")
        .select(
          "notes, workout_sets(set_number, reps, weight_kg, duration_seconds, distance_m)"
        )
        .eq("id", editingLogId!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!editingLogId,
  });

  // Prefill on open (state adjustment during render — react.dev "You Might Not Need an Effect").
  // When editing, wait until the existing log has loaded before prefilling.
  const prefillToken =
    !open || !item
      ? null
      : isEditing
        ? existingLog
          ? `edit:${editingLogId}`
          : null
        : `new:${item.id}`;
  const [prefillKey, setPrefillKey] = useState<string | null>(null);
  if (prefillToken && prefillToken !== prefillKey) {
    setPrefillKey(prefillToken);
    if (isEditing && existingLog) {
      const loaded = [...existingLog.workout_sets].sort(
        (a, b) => a.set_number - b.set_number
      );
      setSets(loaded.length ? loaded.map(fromLoggedSet) : [emptySet()]);
      setNotes(existingLog.notes ?? "");
    } else {
      setSets(logType === "weight_reps" ? setsFromTargets(targets) : [emptySet()]);
      setNotes("");
    }
  }

  const prClause = (pr: { type: string; value: number; previous: number }) =>
    pr.type === "weight"
      ? `🏆 New PR! ${pr.value} kg (was ${pr.previous} kg)`
      : `🏆 Rep PR! ${pr.value} reps at top weight (was ${pr.previous})`;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const validSets = toSetInputs(sets, logType);
      if (isEditing) {
        return updateLog({
          log_id: editingLogId!,
          notes: notes || undefined,
          sets: validSets,
          for_user_id: forUserId,
        });
      }
      return logWorkoutFromPlan({
        plan_item_id: item!.id,
        workout_id: item!.workout_id,
        notes: notes || undefined,
        sets: validSets,
        for_user_id: forUserId,
      });
    },
    onMutate: async () => {
      // Optimistically mark complete only when logging fresh
      if (isEditing) return { previousPlan: undefined };
      await queryClient.cancelQueries({ queryKey: planKey });
      const previousPlan =
        queryClient.getQueryData<DailyPlanItemWithWorkout[]>(planKey);
      queryClient.setQueryData<DailyPlanItemWithWorkout[]>(planKey, (old) =>
        (old ?? []).map((p) =>
          p.id === item?.id
            ? { ...p, is_completed: true, workout_log_id: "optimistic-id" }
            : p
        )
      );
      return { previousPlan };
    },
    onError: (err, _vars, context) => {
      if (context?.previousPlan) {
        queryClient.setQueryData(planKey, context.previousPlan);
      }
      toast.error("Failed to save. Please try again.");
    },
    onSuccess: (result) => {
      if (result?.error) {
        toast.error(result.error);
        return;
      }
      vibrate(50);
      if (result && "pr" in result && result.pr) {
        vibrate([50, 50, 100]);
        toast.success(prClause(result.pr), { duration: 6000 });
      } else {
        toast.success(isEditing ? "Log updated!" : "Sets logged!");
      }
      onOpenChange(false);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: planKey });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["streaks"] });
      queryClient.invalidateQueries({ queryKey: ["last-session", item?.workout_id] });
      if (editingLogId)
        queryClient.invalidateQueries({ queryKey: ["log-detail", editingLogId] });
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
    if (toSetInputs(sets, logType).length === 0) {
      toast.error("Add at least one completed set");
      return;
    }
    saveMutation.mutate();
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setSets([emptySet()]);
      setNotes("");
      setPrefillKey(null);
    }
    onOpenChange(isOpen);
  };

  return (
    <ResponsiveSheetDrawer
      open={open}
      onOpenChange={handleOpenChange}
      title={item?.workouts.name ?? ""}
      description={isEditing ? "Edit your logged sets" : "Log your sets and reps"}
      icon={<Dumbbell className="h-5 w-5 text-primary" />}
      footer={
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={saveMutation.isPending}
        >
          {saveMutation.isPending ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? "Update Sets" : "Save Sets"}
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
        {logType === "weight_reps" && targets?.target_sets ? (
          <p className="text-xs text-muted-foreground">
            Target: {targets.target_sets} sets
            {targets.target_reps ? ` × ${targets.target_reps} reps` : ""}
            {targets.target_weight_kg ? ` @ ${targets.target_weight_kg} kg` : ""}
          </p>
        ) : (
          <SchemeTag
            sets={item?.workouts.default_sets}
            reps={item?.workouts.default_reps}
          />
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
