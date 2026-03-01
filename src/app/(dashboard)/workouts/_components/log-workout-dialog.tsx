"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { logWorkout } from "../actions";
import { SetInputRow } from "./set-input-row";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { Workout } from "@/lib/types";

interface LogWorkoutDialogProps {
  workout: Workout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners?: { id: string; full_name: string | null }[];
}

interface SetData {
  reps: number;
  weight_kg: number;
}

export function LogWorkoutDialog({
  workout,
  open,
  onOpenChange,
  partners,
}: LogWorkoutDialogProps) {
  const [sets, setSets] = useState<SetData[]>([{ reps: 0, weight_kg: 0 }]);
  const [notes, setNotes] = useState("");
  const [forUserId, setForUserId] = useState<string>("myself");
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
    const partnerName =
      forUserId !== "myself"
        ? partners?.find((p) => p.id === forUserId)?.full_name
        : null;

    const result = await logWorkout({
      workout_id: workout.id,
      notes: notes || undefined,
      sets: validSets.map((s, i) => ({
        set_number: i + 1,
        reps: s.reps,
        weight_kg: s.weight_kg,
      })),
      for_user_id: forUserId !== "myself" ? forUserId : undefined,
    });

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(
        partnerName
          ? `Workout logged for ${partnerName}!`
          : "Workout logged!"
      );
      onOpenChange(false);
      setSets([{ reps: 0, weight_kg: 0 }]);
      setNotes("");
      setForUserId("myself");
    }
    setLoading(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Log: {workout?.name}</SheetTitle>
        </SheetHeader>
        <div className="mt-4 space-y-4">
          {partners && partners.length > 0 && (
            <div className="space-y-2">
              <Label>Log for</Label>
              <Select value={forUserId} onValueChange={setForUserId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="myself">Myself</SelectItem>
                  {partners.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.full_name ?? "Partner"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {forUserId !== "myself" && (
                <p className="text-xs text-muted-foreground">
                  Partner logs are restricted to today only
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label>Sets</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="w-8 text-center">Set</span>
                <span className="w-20">Reps</span>
                <span className="w-20">Weight</span>
              </div>
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
            <Button
              variant="outline"
              size="sm"
              onClick={addSet}
              className="w-full"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Set
            </Button>
          </div>
          <div className="space-y-2">
            <Label>Notes (optional)</Label>
            <Textarea
              placeholder="How did it feel?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Workout"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
