"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  Activity,
  Dumbbell,
  Layers,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { ReportFilters } from "./report-filters";
import { ProgressChart } from "./progress-chart";
import { ExerciseProgress } from "./exercise-progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import type { Tag } from "@/lib/types";

interface LogData {
  id: string;
  performed_at: string;
  workouts: {
    id: string;
    name: string;
    workout_tags: { tag_id: string; tags: { name: string } }[];
  };
  workout_sets: { reps: number; weight_kg: number }[];
}

interface ReportsClientProps {
  logs: LogData[];
  tags: Tag[];
  workouts: { id: string; name: string }[];
  dateFrom: string;
  dateTo: string;
}

const setVolume = (sets: LogData["workout_sets"]) =>
  sets.reduce((sum, s) => sum + (s.reps ?? 0) * Number(s.weight_kg), 0);

const volumeConfig = {
  volume: { label: "Volume (kg)", color: "var(--chart-1)" },
};

function compactKg(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}t`;
  return `${Math.round(n)}`;
}

export function ReportsClient({
  logs,
  tags,
  workouts,
  dateFrom,
  dateTo,
}: ReportsClientProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      if (selectedTag) {
        if (!log.workouts.workout_tags.some((wt) => wt.tag_id === selectedTag))
          return false;
      }
      if (selectedWorkout && log.workouts.id !== selectedWorkout) return false;
      return true;
    });
  }, [logs, selectedTag, selectedWorkout]);

  // ---- period KPIs ----
  const kpis = useMemo(() => {
    const days = new Set<string>();
    let volume = 0;
    let sets = 0;
    for (const log of filtered) {
      days.add(log.performed_at.slice(0, 10));
      volume += setVolume(log.workout_sets);
      sets += log.workout_sets.length;
    }
    const sessions = days.size;
    return {
      sessions,
      volume,
      sets,
      avgVolume: sessions ? Math.round(volume / sessions) : 0,
    };
  }, [filtered]);

  // ---- volume by day (always populated) ----
  const volumeByDay = useMemo(() => {
    const map = new Map<string, number>();
    for (const log of filtered) {
      const k = log.performed_at.slice(0, 10);
      map.set(k, (map.get(k) ?? 0) + setVolume(log.workout_sets));
    }
    return [...map.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, volume]) => ({
        date: format(new Date(day + "T00:00:00"), "MMM d"),
        volume,
      }));
  }, [filtered]);

  // ---- muscle distribution ----
  const muscleSplit = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const log of filtered) {
      for (const wt of log.workouts.workout_tags) {
        counts[wt.tags.name] = (counts[wt.tags.name] ?? 0) + 1;
      }
    }
    const entries = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    const max = entries[0]?.[1] ?? 1;
    return { entries, max };
  }, [filtered]);

  // ---- top exercises by volume ----
  const topExercises = useMemo(() => {
    const map: Record<string, { id: string; name: string; volume: number }> = {};
    for (const log of filtered) {
      const id = log.workouts.id;
      const e = (map[id] ??= { id, name: log.workouts.name, volume: 0 });
      e.volume += setVolume(log.workout_sets);
    }
    return Object.values(map)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5);
  }, [filtered]);

  const topVol = topExercises[0]?.volume ?? 1;

  // ---- per-exercise deep dive ----
  const progressData = useMemo(() => {
    if (!selectedWorkout) return [];
    return filtered
      .filter((l) => l.workouts.id === selectedWorkout)
      .map((log) => ({
        date: format(new Date(log.performed_at), "MMM d"),
        maxWeight: Math.max(...log.workout_sets.map((s) => Number(s.weight_kg)), 0),
      }));
  }, [filtered, selectedWorkout]);

  const volumeData = useMemo(() => {
    if (!selectedWorkout) return [];
    return filtered
      .filter((l) => l.workouts.id === selectedWorkout)
      .map((log) => ({
        date: format(new Date(log.performed_at), "MMM d"),
        volume: setVolume(log.workout_sets),
      }));
  }, [filtered, selectedWorkout]);

  const selectedExerciseName =
    workouts.find((w) => w.id === selectedWorkout)?.name ?? "";

  const stats = [
    { label: "Sessions", value: `${kpis.sessions}`, icon: Activity, suffix: undefined as string | undefined },
    { label: "Volume", value: compactKg(kpis.volume), suffix: "kg", icon: TrendingUp },
    { label: "Sets", value: `${kpis.sets}`, icon: Layers, suffix: undefined },
    { label: "Avg / session", value: compactKg(kpis.avgVolume), suffix: "kg", icon: Dumbbell },
  ];

  const empty = filtered.length === 0;

  return (
    <div className="space-y-5">
      <ReportFilters
        tags={tags}
        workouts={workouts}
        dateFrom={dateFrom}
        dateTo={dateTo}
        selectedTag={selectedTag}
        selectedWorkout={selectedWorkout}
        onTagChange={setSelectedTag}
        onWorkoutChange={setSelectedWorkout}
      />

      {empty ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center gap-2 py-16 text-center text-muted-foreground">
            <Activity className="h-10 w-10 opacity-40" />
            <p className="text-sm">No training data in this range.</p>
            <p className="text-xs">Adjust the dates or log a workout.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* KPI strip */}
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {stats.map((s) => {
              const Icon = s.icon;
              return (
                <Card key={s.label} className="p-3">
                  <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
                    <Icon className="h-3.5 w-3.5" />
                    {s.label}
                  </div>
                  <div className="mt-1 flex items-baseline gap-1">
                    <span className="text-2xl font-bold leading-none">
                      {s.value}
                    </span>
                    {s.suffix && (
                      <span className="text-xs text-muted-foreground">
                        {s.suffix}
                      </span>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            {/* Volume trend */}
            <Card className="lg:col-span-2">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Volume per session</CardTitle>
              </CardHeader>
              <CardContent>
                {volumeByDay.length > 0 ? (
                  <ChartContainer config={volumeConfig} className="h-[240px] w-full">
                    <AreaChart data={volumeByDay} margin={{ left: 4, right: 8, top: 8 }}>
                      <CartesianGrid vertical={false} strokeDasharray="3 3" />
                      <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                      <YAxis
                        tickLine={false}
                        axisLine={false}
                        width={42}
                        fontSize={11}
                        tickFormatter={(v: number) => compactKg(v)}
                      />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Area
                        type="monotone"
                        dataKey="volume"
                        stroke="var(--color-volume)"
                        fill="var(--color-volume)"
                        fillOpacity={0.2}
                        strokeWidth={2}
                      />
                    </AreaChart>
                  </ChartContainer>
                ) : (
                  <p className="py-12 text-center text-sm text-muted-foreground">
                    No volume to chart
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Muscle split */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Muscle split</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {muscleSplit.entries.length === 0 ? (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No tagged exercises
                  </p>
                ) : (
                  muscleSplit.entries.map(([name, count]) => (
                    <div key={name} className="space-y-1">
                      <div className="flex justify-between text-xs">
                        <span className="capitalize">
                          {name.replace(/_/g, " ")}
                        </span>
                        <span className="text-muted-foreground">{count}</span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(count / muscleSplit.max) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Top exercises */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-base">
                <Trophy className="h-4 w-4 text-amber-500" />
                Top exercises by volume
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {topExercises.map((e, i) => (
                <button
                  key={e.id}
                  onClick={() => setSelectedWorkout(e.id)}
                  className="flex w-full items-center gap-3 rounded-lg p-1.5 text-left transition-colors hover:bg-muted/50"
                >
                  <span className="w-4 text-sm font-semibold text-muted-foreground">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{e.name}</p>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary/70"
                        style={{ width: `${(e.volume / topVol) * 100}%` }}
                      />
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {compactKg(e.volume)} kg
                  </span>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Per-exercise deep dive */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">
              {selectedWorkout
                ? `Deep dive · ${selectedExerciseName}`
                : "Tap an exercise above for weight & volume progression"}
            </h2>
            {selectedWorkout && (
              <div className="grid gap-4 md:grid-cols-2">
                <ProgressChart data={progressData} exerciseName={selectedExerciseName} />
                <ExerciseProgress data={volumeData} exerciseName={selectedExerciseName} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
