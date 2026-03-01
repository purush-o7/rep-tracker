"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Eye, Trash2, ClipboardList } from "lucide-react";
import { toast } from "sonner";
import { deleteLog } from "../../workouts/actions";
import { LogFilters } from "./log-filters";
import { LogDetailSheet } from "./log-detail-sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { WorkoutLogWithDetails } from "@/lib/types";

interface LogListProps {
  logs: WorkoutLogWithDetails[];
  readOnly?: boolean;
}

export function LogList({ logs, readOnly }: LogListProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedLog, setSelectedLog] = useState<WorkoutLogWithDetails | null>(
    null
  );

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const date = new Date(log.performed_at);
      if (dateFrom && date < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (date > endOfDay) return false;
      }
      return true;
    });
  }, [logs, dateFrom, dateTo]);

  const handleDelete = async (id: string) => {
    const result = await deleteLog(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Log deleted");
    }
  };

  if (logs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ClipboardList className="mb-4 h-12 w-12" />
        <p className="text-lg font-medium">No workout logs yet</p>
        <p className="text-sm">Start logging workouts to see them here</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <LogFilters
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
      />

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Exercise</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Sets</TableHead>
              <TableHead>Volume (kg)</TableHead>
              <TableHead className="w-[80px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((log) => {
              const volume = log.workout_sets.reduce(
                (sum, s) => sum + s.reps * Number(s.weight_kg),
                0
              );
              return (
                <TableRow key={log.id}>
                  <TableCell className="font-medium">
                    {log.workouts.name}
                  </TableCell>
                  <TableCell>
                    {format(new Date(log.performed_at), "PP")}
                  </TableCell>
                  <TableCell>{log.workout_sets.length}</TableCell>
                  <TableCell>{volume.toLocaleString()}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setSelectedLog(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(log.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {filtered.map((log) => {
          const volume = log.workout_sets.reduce(
            (sum, s) => sum + s.reps * Number(s.weight_kg),
            0
          );
          return (
            <Card
              key={log.id}
              className="cursor-pointer"
              onClick={() => setSelectedLog(log)}
            >
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    {log.workouts.name}
                  </CardTitle>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(log.id);
                      }}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-4 text-sm text-muted-foreground">
                  <span>{format(new Date(log.performed_at), "PP")}</span>
                  <span>{log.workout_sets.length} sets</span>
                  <span>{volume.toLocaleString()} kg</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <LogDetailSheet
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
      />
    </div>
  );
}
