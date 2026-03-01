"use client";

import { format } from "date-fns";
import {
  Sheet,
  SheetContent,
  SheetHeader,
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
}

export function LogDetailSheet({ log, open, onOpenChange }: LogDetailSheetProps) {
  if (!log) return null;

  const totalVolume = log.workout_sets.reduce(
    (sum, s) => sum + s.reps * Number(s.weight_kg),
    0
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{log.workouts.name}</SheetTitle>
          <p className="text-sm text-muted-foreground">
            {format(new Date(log.performed_at), "PPp")}
          </p>
        </SheetHeader>
        <div className="mt-4 space-y-4">
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
          <div className="rounded-lg border p-3">
            <p className="text-sm font-medium">
              Total Volume: {totalVolume.toLocaleString()} kg
            </p>
          </div>
          {log.notes && (
            <div className="rounded-lg border p-3">
              <p className="text-sm font-medium">Notes</p>
              <p className="text-sm text-muted-foreground">{log.notes}</p>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
