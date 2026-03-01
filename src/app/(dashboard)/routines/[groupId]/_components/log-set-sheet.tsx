"use client";

import { useState } from "react";
import { Dumbbell, Plus, Save } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ResponsiveSheetDrawer } from "@/components/responsive-sheet-drawer";
import { SetInputRow } from "@/app/(dashboard)/workouts/_components/set-input-row";
import { logWorkout } from "@/app/(dashboard)/workouts/actions";
import type { Workout } from "@/lib/types";

interface LogSetSheetProps {
  workout: Workout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface SetData {
  reps: number;
  weight_kg: number;
}

export function LogSetSheet({
  workout,
  open,
  onOpenChange,
}: LogSetSheetProps) {
  const [sets, setSets] = useState<SetData[]>([{ reps: 0, weight_kg: 0 }]);
  const [loading, setLoading] = useState(false);

  const addSet = () => setSets([...sets, { reps: 0, weight_kg: 0 }]);

  const removeSet = (index: number) =>
    setSets(sets.filter((_, i) => i !== index));

  const updateSet = (index: number, field: keyof SetData, value: number) => {
    const updated = [...sets];
    updated[index] = { ...updated[index], [field]: value };
    setSets(updated);
  };

  const handleSubmit = async () => {
    if (!workout) return;

    const validSets = sets.filter((s) => s.reps > 0);
    if (validSets.length === 0) {
      toast.error("Add at least one set with reps");
      return;
    }

    setLoading(true);
    const result = await logWorkout({
      workout_id: workout.id,
      sets: validSets.map((s, i) => ({
        set_number: i + 1,
        reps: s.reps,
        weight_kg: s.weight_kg,
      })),
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Sets logged!");
      onOpenChange(false);
      setSets([{ reps: 0, weight_kg: 0 }]);
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
        <p className="text-xs text-center text-muted-foreground">
          {sets.length} {sets.length === 1 ? "set" : "sets"} &middot; Sets with 0 reps will be skipped
        </p>
      </div>
    </ResponsiveSheetDrawer>
  );
}
