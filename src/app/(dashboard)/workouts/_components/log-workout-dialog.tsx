"use client";

import { useState, useTransition } from "react";
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
  SheetBody,
  SheetFooter,
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
  id: number;
  reps: number;
  weight_kg: number;
}

let nextSetId = 0;

export function LogWorkoutDialog({
  workout,
  open,
  onOpenChange,
  partners,
}: LogWorkoutDialogProps) {
  const [sets, setSets] = useState<SetData[]>([
    { id: nextSetId++, reps: 0, weight_kg: 0 },
  ]);
  const [notes, setNotes] = useState("");
  const [forUserId, setForUserId] = useState<string>("myself");
  const [isPending, startTransition] = useTransition();

  const addSet = () =>
    setSets((prev) => [...prev, { id: nextSetId++, reps: 0, weight_kg: 0 }]);

  const removeSet = (index: number) =>
    setSets((prev) => prev.filter((_, i) => i !== index));

  const updateSet = (index: number, field: keyof Omit<SetData, "id">, value: number) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSubmit = () => {
    if (!workout) return;

    const validSets = sets.filter((s) => s.reps > 0);
    if (validSets.length === 0) {
      toast.error("Add at least one set with reps");
      return;
    }

    const partnerName =
      forUserId !== "myself"
        ? partners?.find((p) => p.id === forUserId)?.full_name
        : null;

    startTransition(async () => {
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
        setSets([{ id: nextSetId++, reps: 0, weight_kg: 0 }]);
        setNotes("");
        setForUserId("myself");
      }
    });
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Log: {workout?.name}</SheetTitle>
        </SheetHeader>
        <SheetBody className="space-y-4">
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
                  key={set.id}
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
              className="w-full border-dashed"
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
        </SheetBody>
        <SheetFooter>
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? "Saving..." : "Save Workout"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
