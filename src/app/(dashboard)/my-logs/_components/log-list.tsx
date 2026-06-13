"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  Trash2,
  ClipboardList,
  Download,
  Loader2,
  Trophy,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { deleteLog } from "../../workouts/actions";
import { fetchAllLogsForExport } from "../actions";
import { LogFilters } from "./log-filters";
import { LogDetailSheet } from "./log-detail-sheet";
import { summarizeLog, logSetType } from "./log-helpers";
import { DataPagination } from "@/components/data-pagination";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

interface DayGroup {
  date: string; // ISO day key
  logs: WorkoutLogWithDetails[];
  volume: number;
  prCount: number;
}

function groupByDay(logs: WorkoutLogWithDetails[]): DayGroup[] {
  const map = new Map<string, DayGroup>();
  for (const log of logs) {
    const key = log.performed_at.slice(0, 10);
    let group = map.get(key);
    if (!group) {
      group = { date: log.performed_at, logs: [], volume: 0, prCount: 0 };
      map.set(key, group);
    }
    group.logs.push(log);
    group.volume += summarizeLog(log).volume;
    if (log.is_pr) group.prCount += 1;
  }
  return [...map.values()];
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

  const groups = useMemo(() => groupByDay(logs), [logs]);

  const handleExportCsv = async () => {
    setExporting(true);
    try {
      const result = await fetchAllLogsForExport({ dateFrom, dateTo });
      if (result.error || !result.data) {
        toast.error(result.error || "Failed to fetch logs");
        return;
      }
      const escapeCsv = (val: string) =>
        /[",\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;

      const rows = [
        "Date,Exercise,Set#,Reps,Weight(kg),Duration(s),Distance(m),Notes",
      ];
      for (const log of result.data) {
        const date = new Date(log.performed_at).toLocaleDateString();
        const name =
          (log.workouts as unknown as { name: string } | null)?.name ??
          "Unknown";
        const notes = log.notes ?? "";
        const sets = log.workout_sets as {
          set_number: number;
          reps: number | null;
          weight_kg: number;
          duration_seconds: number | null;
          distance_m: number | null;
        }[];
        if (sets.length === 0) {
          rows.push(
            [date, escapeCsv(name), "", "", "", "", "", escapeCsv(notes)].join(",")
          );
        } else {
          for (const s of sets) {
            rows.push(
              [
                date,
                escapeCsv(name),
                String(s.set_number),
                s.reps != null ? String(s.reps) : "",
                String(s.weight_kg),
                s.duration_seconds != null ? String(s.duration_seconds) : "",
                s.distance_m != null ? String(s.distance_m) : "",
                escapeCsv(notes),
              ].join(",")
            );
          }
        }
      }

      const blob = new Blob([rows.join("\n")], {
        type: "text/csv;charset=utf-8;",
      });
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
    if (result.error) toast.error(result.error);
    else toast.success("Log deleted");
  };

  if (totalCount === 0 && !dateFrom && !dateTo) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
          <ClipboardList className="h-8 w-8 text-primary" />
        </div>
        <p className="text-lg font-medium text-foreground">No workout logs yet</p>
        <p className="text-sm">Log a workout from Today or the catalog to see it here.</p>
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

      {groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <ClipboardList className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">No logs found</p>
          <p className="text-sm">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <Card key={group.date} className="overflow-hidden">
              <CardHeader className="flex-row items-center justify-between gap-2 border-b bg-muted/30 py-3">
                <div className="min-w-0">
                  <p className="font-semibold leading-tight">
                    {format(new Date(group.date), "EEE, d MMM yyyy")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {group.logs.length}{" "}
                    {group.logs.length === 1 ? "exercise" : "exercises"}
                    {group.volume > 0 &&
                      ` · ${group.volume.toLocaleString()} kg`}
                  </p>
                </div>
                {group.prCount > 0 && (
                  <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <Trophy className="h-3 w-3" />
                    {group.prCount} PR
                  </span>
                )}
              </CardHeader>
              <CardContent className="divide-y p-0">
                {group.logs.map((log) => {
                  const s = summarizeLog(log);
                  return (
                    <div
                      key={log.id}
                      className="flex cursor-pointer items-center gap-3 px-3 py-2.5 transition-colors hover:bg-muted/40"
                      onClick={() => setSelectedLog(log)}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1.5 truncate font-medium">
                          {log.workouts.name}
                          {log.is_pr && (
                            <Trophy className="h-3.5 w-3.5 shrink-0 text-amber-500" />
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {s.setCount} {s.setCount === 1 ? "set" : "sets"} ·{" "}
                          {s.metric}
                        </p>
                      </div>
                      {logSetType(log) === "weight_reps" && s.volume > 0 && (
                        <span className="shrink-0 text-xs text-muted-foreground">
                          {s.volume.toLocaleString()} kg
                        </span>
                      )}
                      {!readOnly && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(log.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                      <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
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
