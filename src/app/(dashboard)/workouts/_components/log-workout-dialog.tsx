"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { logWorkout } from "../actions";
import { SetInputRow } from "./set-input-row";
import { LastSessionRef } from "@/components/last-session-ref";
import { PlateCalculator } from "@/components/plate-calculator";
import { EquipmentNote } from "@/components/equipment-note";
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
import {
  emptySet,
  fromLoggedSet,
  toSetInputs,
  type SetEntry,
} from "@/lib/set-entry";
import type { Workout } from "@/lib/types";

interface LogWorkoutDialogProps {
  workout: Workout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partners?: { id: string; full_name: string | null }[];
}

interface KeyedSet extends SetEntry {
  id: number;
}

let nextSetId = 0;

function newKeyedSet(base?: SetEntry): KeyedSet {
  return { id: nextSetId++, ...(base ?? emptySet()) };
}

export function LogWorkoutDialog({
  workout,
  open,
  onOpenChange,
  partners,
}: LogWorkoutDialogProps) {
  const [sets, setSets] = useState<KeyedSet[]>([newKeyedSet()]);
  const [notes, setNotes] = useState("");
  const [forUserId, setForUserId] = useState<string>("myself");
  const [isPending, startTransition] = useTransition();
  const queryClient = useQueryClient();

  const logType = workout?.log_type ?? "weight_reps";

  const addSet = () =>
    setSets((prev) => [...prev, newKeyedSet(prev[prev.length - 1])]);

  const removeSet = (index: number) =>
    setSets((prev) => prev.filter((_, i) => i !== index));

  const updateSet = (index: number, patch: Partial<SetEntry>) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const handleSubmit = () => {
    if (!workout) return;

    const validSets = toSetInputs(sets, logType);
    if (validSets.length === 0) {
      toast.error("Add at least one completed set");
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
        sets: validSets,
        for_user_id: forUserId !== "myself" ? forUserId : undefined,
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
          toast.success(
            partnerName
              ? `Workout logged for ${partnerName}!`
              : "Workout logged!"
          );
        }
        queryClient.invalidateQueries({ queryKey: ["last-session", workout.id] });
        onOpenChange(false);
        setSets([newKeyedSet()]);
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

          {forUserId === "myself" && (
            <>
              <EquipmentNote workoutId={workout?.id ?? null} enabled={open} />
              <LastSessionRef
                workoutId={workout?.id ?? null}
                enabled={open}
                onApply={(session) =>
                  setSets(
                    session.sets.map((s) => newKeyedSet(fromLoggedSet(s)))
                  )
                }
              />
            </>
          )}

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Sets</Label>
              {logType === "weight_reps" && (
                <PlateCalculator
                  initialWeight={sets.find((s) => s.weight_kg > 0)?.weight_kg}
                />
              )}
            </div>
            <div className="space-y-2">
              {sets.map((set, i) => (
                <SetInputRow
                  key={set.id}
                  index={i}
                  logType={logType}
                  entry={set}
                  onChange={(patch) => updateSet(i, patch)}
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
