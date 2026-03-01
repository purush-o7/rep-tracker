"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Eye, Trash2, ClipboardList, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { deleteLog } from "../../workouts/actions";
import { fetchAllLogsForExport } from "../actions";
import { LogFilters } from "./log-filters";
import { LogDetailSheet } from "./log-detail-sheet";
import { DataPagination } from "@/components/data-pagination";
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
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
  dateFrom?: string;
  dateTo?: string;
}

export function LogList({
  logs,
  readOnly,
  currentPage,
  pageSize,
  totalCount,
  totalPages,
  dateFrom,
  dateTo,
}: LogListProps) {
  const [selectedLog, setSelectedLog] = useState<WorkoutLogWithDetails | null>(
    null
  );
  const [exporting, setExporting] = useState(false);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const result = await fetchAllLogsForExport({ dateFrom, dateTo });
      if (result.error || !result.data) {
        toast.error(result.error || "Failed to fetch logs");
        return;
      }

      const escapeCsv = (val: string) => {
        if (val.includes(",") || val.includes('"') || val.includes("\n")) {
          return `"${val.replace(/"/g, '""')}"`;
        }
        return val;
      };

      const rows = ["Date,Exercise,Set#,Reps,Weight(kg),Notes"];
      for (const log of result.data) {
        const date = new Date(log.performed_at).toLocaleDateString();
        const workoutRef = log.workouts as unknown as { name: string } | null;
        const name = workoutRef?.name ?? "Unknown";
        const notes = log.notes ?? "";
        const sets = log.workout_sets as { set_number: number; reps: number; weight_kg: number }[];
        if (sets.length === 0) {
          rows.push(
            [date, escapeCsv(name), "", "", "", escapeCsv(notes)].join(",")
          );
        } else {
          for (const set of sets) {
            rows.push(
              [
                date,
                escapeCsv(name),
                String(set.set_number),
                String(set.reps),
                String(set.weight_kg),
                escapeCsv(notes),
              ].join(",")
            );
          }
        }
      }

      const csv = rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `workout-logs-${new Date().toISOString().split("T")[0]}.csv`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("CSV exported!");
    } finally {
      setExporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    const result = await deleteLog(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Log deleted");
    }
  };

  if (totalCount === 0 && !dateFrom && !dateTo) {
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
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <LogFilters dateFrom={dateFrom} dateTo={dateTo} />
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleExportCsv}
          disabled={exporting}
          title="Export to CSV"
        >
          {exporting ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Download className="h-4 w-4" />
          )}
        </Button>
      </div>

      {logs.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ClipboardList className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">No logs found</p>
          <p className="text-sm">Try adjusting your date filters</p>
        </div>
      ) : (
        <>
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
                {logs.map((log) => {
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
            {logs.map((log) => {
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
        </>
      )}

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
      />

      <LogDetailSheet
        log={selectedLog}
        open={!!selectedLog}
        onOpenChange={(open) => !open && setSelectedLog(null)}
        readOnly={readOnly}
      />
    </div>
  );
}
