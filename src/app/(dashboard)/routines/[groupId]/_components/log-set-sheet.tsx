"use client";

import { useState } from "react";
import { Dumbbell, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveSheetDrawer } from "@/components/responsive-sheet-drawer";
import { SetInputRow } from "@/app/(dashboard)/workouts/_components/set-input-row";
import { LastSessionRef } from "@/components/last-session-ref";
import { PlateCalculator } from "@/components/plate-calculator";
import { EquipmentNote } from "@/components/equipment-note";
import { SchemeTag } from "@/components/scheme-tag";
import { logWorkout } from "@/app/(dashboard)/workouts/actions";
import {
  emptySet,
  fromLoggedSet,
  toSetInputs,
  type SetEntry,
} from "@/lib/set-entry";
import type { Workout, ExerciseTargets } from "@/lib/types";

interface LogSetSheetProps {
  workout: Workout | null;
  targets?: ExerciseTargets | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function setsFromTargets(targets?: ExerciseTargets | null): SetEntry[] {
  if (!targets?.target_sets) return [emptySet()];
  return Array.from({ length: targets.target_sets }, () => ({
    ...emptySet(),
    reps: targets.target_reps ?? 0,
    weight_kg: targets.target_weight_kg ?? 0,
  }));
}

export function LogSetSheet({
  workout,
  targets,
  open,
  onOpenChange,
}: LogSetSheetProps) {
  const [sets, setSets] = useState<SetEntry[]>([emptySet()]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();

  const logType = workout?.log_type ?? "weight_reps";

  // Prefill from routine targets each time a new workout is opened
  // (state adjustment during render — see react.dev "You Might Not Need an Effect")
  const [prefillKey, setPrefillKey] = useState<string | null>(null);
  const openKey = open ? (workout?.id ?? null) : null;
  if (openKey !== prefillKey) {
    setPrefillKey(openKey);
    if (openKey) {
      setSets(logType === "weight_reps" ? setsFromTargets(targets) : [emptySet()]);
    }
  }

  const addSet = () => setSets((prev) => [...prev, emptySet()]);

  const removeSet = (index: number) =>
    setSets((prev) => prev.filter((_, i) => i !== index));

  const updateSet = (index: number, patch: Partial<SetEntry>) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const handleSubmit = async () => {
    if (!workout) return;

    const validSets = toSetInputs(sets, logType);
    if (validSets.length === 0) {
      toast.error("Add at least one completed set");
      return;
    }

    setLoading(true);
    const result = await logWorkout({
      workout_id: workout.id,
      notes: notes || undefined,
      sets: validSets,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      if ("pr" in result && result.pr) {
        toast.success(
          result.pr.type === "weight"
            ? `🏆 New PR! ${result.pr.value} kg (was ${result.pr.previous} kg)`
            : `🏆 Rep PR! ${result.pr.value} reps at top weight (was ${result.pr.previous})`,
          { duration: 6000 }
        );
      } else {
        toast.success("Sets logged!");
      }
      queryClient.invalidateQueries({ queryKey: ["last-session", workout.id] });
      onOpenChange(false);
      setSets([emptySet()]);
      setNotes("");
    }
    setLoading(false);
  };

  return (
    <ResponsiveSheetDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={workout?.name ?? ""}
      description="Log your sets and reps"
      icon={<Dumbbell className="h-5 w-5 text-primary" />}
      footer={
        <Button
          className="w-full"
          size="lg"
          onClick={handleSubmit}
          disabled={loading}
        >
          <Save className="mr-2 h-4 w-4" />
          {loading ? "Saving..." : "Save Sets"}
        </Button>
      }
    >
      <div className="space-y-4">
        <EquipmentNote workoutId={workout?.id ?? null} enabled={open} />
        <LastSessionRef
          workoutId={workout?.id ?? null}
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
          <SchemeTag sets={workout?.default_sets} reps={workout?.default_reps} />
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
          {sets.length} {sets.length === 1 ? "set" : "sets"} &middot; Empty sets will be skipped
        </p>
      </div>
    </ResponsiveSheetDrawer>
  );
}
