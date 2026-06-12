"use client";

import { useState, useTransition } from "react";
import { format } from "date-fns";
import { Pencil, Plus, X, Trophy } from "lucide-react";
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
import {
  fromLoggedSet,
  toSetInputs,
  formatLoggedSet,
  emptySet,
  type SetEntry,
} from "@/lib/set-entry";
import type { WorkoutLogWithDetails } from "@/lib/types";

interface LogDetailSheetProps {
  log: WorkoutLogWithDetails | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
}

interface KeyedSet extends SetEntry {
  id: number;
}

let nextSetId = 0;

export function LogDetailSheet({
  log,
  open,
  onOpenChange,
  readOnly,
}: LogDetailSheetProps) {
  const [editing, setEditing] = useState(false);
  const [sets, setSets] = useState<KeyedSet[]>([]);
  const [notes, setNotes] = useState("");
  const [isPending, startTransition] = useTransition();

  const logType = log?.workouts.log_type ?? "weight_reps";

  const setsFromLog = (l: WorkoutLogWithDetails): KeyedSet[] =>
    [...l.workout_sets]
      .sort((a, b) => a.set_number - b.set_number)
      .map((s) => ({ id: nextSetId++, ...fromLoggedSet(s) }));

  // Sync edit state when a different log opens; reset edit mode on close
  // (state adjustment during render — see react.dev "You Might Not Need an Effect")
  const [syncKey, setSyncKey] = useState<string | null>(null);
  const openKey = open && log ? log.id : null;
  if (openKey !== syncKey) {
    setSyncKey(openKey);
    if (openKey && log) {
      setSets(setsFromLog(log));
      setNotes(log.notes ?? "");
    } else {
      setEditing(false);
    }
  }

  if (!log) return null;

  const totalVolume = editing
    ? sets.reduce((sum, s) => sum + s.reps * s.weight_kg, 0)
    : log.workout_sets.reduce(
        (sum, s) => sum + (s.reps ?? 0) * Number(s.weight_kg),
        0
      );

  const addSet = () =>
    setSets((prev) => [
      ...prev,
      { ...(prev[prev.length - 1] ?? emptySet()), id: nextSetId++ },
    ]);

  const removeSet = (index: number) =>
    setSets((prev) => prev.filter((_, i) => i !== index));

  const updateSet = (index: number, patch: Partial<SetEntry>) => {
    setSets((prev) =>
      prev.map((s, i) => (i === index ? { ...s, ...patch } : s))
    );
  };

  const handleSave = () => {
    const validSets = toSetInputs(sets, logType);
    if (validSets.length === 0) {
      toast.error("Add at least one completed set");
      return;
    }

    startTransition(async () => {
      const result = await updateLog({
        log_id: log.id,
        notes: notes || undefined,
        sets: validSets,
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
    setSets(setsFromLog(log));
    setNotes(log.notes ?? "");
    setEditing(false);
  };

  const measureLabel =
    logType === "duration"
      ? "Duration"
      : logType === "distance"
        ? "Distance"
        : "Reps";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md">
        <SheetHeader>
          <div className="flex items-center justify-between">
            <SheetTitle className="flex items-center gap-2">
              {log.workouts.name}
              {log.is_pr && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                  <Trophy className="h-3 w-3" />
                  PR
                </span>
              )}
            </SheetTitle>
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
            </>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Set</TableHead>
                    <TableHead>{measureLabel}</TableHead>
                    {logType === "weight_reps" && (
                      <TableHead>Weight (kg)</TableHead>
                    )}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...log.workout_sets]
                    .sort((a, b) => a.set_number - b.set_number)
                    .map((set) => (
                      <TableRow key={set.id}>
                        <TableCell>{set.set_number}</TableCell>
                        {logType === "weight_reps" ? (
                          <>
                            <TableCell>{set.reps ?? 0}</TableCell>
                            <TableCell>{set.weight_kg}</TableCell>
                          </>
                        ) : (
                          <TableCell>{formatLoggedSet(set)}</TableCell>
                        )}
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
          {logType === "weight_reps" && (
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">
                Total Volume: {totalVolume.toLocaleString()} kg
              </p>
            </div>
          )}
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
