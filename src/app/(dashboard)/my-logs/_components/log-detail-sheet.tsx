"use client";

import { useState, useEffect, useTransition } from "react";
import { format } from "date-fns";
import { Pencil, Plus, X } from "lucide-react";
import { toast } from "sonner";
import { updateLog } from "../../workouts/actions";
import { SetInputRow } from "../../workouts/_components/set-input-row";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetFooter,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkoutLogWithDetails } from "@/lib/types";

interface LogDetailSheetProps {
  log: WorkoutLogWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}

interface SetData {
  id: number;
  reps: number;
  weight_kg: number;
}

let nextSetId = 0;

export function LogDetailSheet({
  log,
  open,
  onOpenChange,
  readOnly,
}: LogDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [sets, setSets] = useState<SetData[]>([]);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  // Reset edit state when log changes or sheet closes
  useEffect(() => {
    if (log && open) {
      setSets(
        log.workout_sets
          .sort((a, b) => a.set_number - b.set_number)
          .map((s) => ({ id: nextSetId++, reps: s.reps, weight_kg: Number(s.weight_kg) }))
      );
      setNotes(log.notes ?? "");
    }
    if (!open) {
      setEditing(false);
    }
  }, [log, open]);

  if (!log) return null;

  const totalVolume = editing
    ? sets.reduce((sum, s) => sum + s.reps * s.weight_kg, 0)
    : log.workout_sets.reduce(
        (sum, s) => sum + s.reps * Number(s.weight_kg),
        0
      );

  const addSet = () =>
    setSets((prev) => [...prev, { id: nextSetId++, reps: 0, weight_kg: 0 }]);

  const removeSet = (index: number) =>
    setSets((prev) => prev.filter((_, i) => i !== index));

  const updateSet = (
    index: number,
    field: "reps" | "weight_kg",
    value: number
  ) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, [field]: value } : s))
    );
  };

  const handleSave = () => {
    const validSets = sets.filter((s) => s.reps > 0);
    if (validSets.length === 0) {
      toast.error("Add at least one set with reps");
      return;
    }

    startTransition(async () => {
      const result = await updateLog({
        log_id: log.id,
        notes: notes || undefined,
        sets: validSets.map((s, i) => ({
          set_number: i + 1,
          reps: s.reps,
          weight_kg: s.weight_kg,
        })),
      });

      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success("Log updated");
        setEditing(false);
        onOpenChange(false);
      }
    });
  };

  const handleCancel = () => {
    // Reset to original log data
    setSets(
      log.workout_sets
        .sort((a, b) => a.set_number - b.set_number)
        .map((s) => ({ id: nextSetId++, reps: s.reps, weight_kg: Number(s.weight_kg) }))
    );
    setNotes(log.notes ?? "");
    setEditing(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle>{log.workouts.name}</SheetTitle>
            {!readOnly && !editing && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setEditing(true)}
              >
                <Pencil className="h-4 w-4" />
              </Button>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {format(new Date(log.performed_at), "PPp")}
          </p>
        </SheetHeader>
        <SheetBody className="space-y-4">
          {editing ? (
            <>
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
            </>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Set</TableHead>
                    <TableHead>Reps</TableHead>
                    <TableHead>Weight (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {log.workout_sets
                    .sort((a, b) => a.set_number - b.set_number)
                    .map((set) => (
                      <TableRow key={set.id}>
                        <TableCell>{set.set_number}</TableCell>
                        <TableCell>{set.reps}</TableCell>
                        <TableCell>{set.weight_kg}</TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {log.notes && (
                <div className="rounded-lg border p-3">
                  <p className="text-sm font-medium">Notes</p>
                  <p className="text-sm text-muted-foreground">{log.notes}</p>
                </div>
              )}
            </>
          )}
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">
              Total Volume: {totalVolume.toLocaleString()} kg
            </p>
          </div>
        </SheetBody>
        {editing && (
          <SheetFooter className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleCancel}
              disabled={isPending}
            >
              <X className="mr-1.5 h-4 w-4" />
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleSave}
              disabled={isPending}
            >
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
