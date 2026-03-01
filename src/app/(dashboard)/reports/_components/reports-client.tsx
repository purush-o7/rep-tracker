"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { ReportFilters } from "./report-filters";
import { ProgressChart } from "./progress-chart";
import { MuscleGroupReport } from "./muscle-group-report";
import { ExerciseProgress } from "./exercise-progress";
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
}

export function ReportsClient({ logs, tags, workouts }: ReportsClientProps) {
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const date = new Date(log.performed_at);
      if (dateFrom && date < dateFrom) return false;
      if (dateTo) {
        const endOfDay = new Date(dateTo);
        endOfDay.setHours(23, 59, 59, 999);
        if (date > endOfDay) return false;
      }
      if (selectedTag) {
        const hasTag = log.workouts.workout_tags.some(
          (wt) => wt.tag_id === selectedTag
        );
        if (!hasTag) return false;
      }
      if (selectedWorkout && log.workouts.id !== selectedWorkout) return false;
      return true;
    });
  }, [logs, dateFrom, dateTo, selectedTag, selectedWorkout]);

  // Weight progression for selected exercise
  const progressData = useMemo(() => {
    if (!selectedWorkout) return [];
    const exerciseLogs = filtered.filter(
      (l) => l.workouts.id === selectedWorkout
    );
    return exerciseLogs.map((log) => ({
      date: format(new Date(log.performed_at), "MMM d"),
      maxWeight: Math.max(
        ...log.workout_sets.map((s) => Number(s.weight_kg)),
        0
      ),
    }));
  }, [filtered, selectedWorkout]);

  // Volume trend for selected exercise
  const volumeData = useMemo(() => {
    if (!selectedWorkout) return [];
    const exerciseLogs = filtered.filter(
      (l) => l.workouts.id === selectedWorkout
    );
    return exerciseLogs.map((log) => ({
      date: format(new Date(log.performed_at), "MMM d"),
      volume: log.workout_sets.reduce(
        (sum, s) => sum + s.reps * Number(s.weight_kg),
        0
      ),
    }));
  }, [filtered, selectedWorkout]);

  // Muscle group distribution by month
  const { muscleGroupData, muscleGroups } = useMemo(() => {
    const monthMap: Record<string, Record<string, number>> = {};
    const groupSet = new Set<string>();

    filtered.forEach((log) => {
      const month = format(new Date(log.performed_at), "MMM yyyy");
      if (!monthMap[month]) monthMap[month] = {};
      log.workouts.workout_tags.forEach((wt) => {
        const name = wt.tags.name;
        groupSet.add(name);
        monthMap[month][name] = (monthMap[month][name] ?? 0) + 1;
      });
    });

    const muscleGroups = Array.from(groupSet).sort();
    const data = Object.entries(monthMap)
      .map(([month, groups]) => ({ month, ...groups }))
      .sort(
        (a, b) =>
          new Date(`1 ${a.month}`).getTime() -
          new Date(`1 ${b.month}`).getTime()
      );

    return { muscleGroupData: data, muscleGroups };
  }, [filtered]);

  const selectedExerciseName =
    workouts.find((w) => w.id === selectedWorkout)?.name ?? "";

  return (
    <div className="space-y-6">
      <ReportFilters
        tags={tags}
        workouts={workouts}
        dateFrom={dateFrom}
        dateTo={dateTo}
        selectedTag={selectedTag}
        selectedWorkout={selectedWorkout}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onTagChange={setSelectedTag}
        onWorkoutChange={setSelectedWorkout}
      />
      <div className="grid gap-4 md:grid-cols-2">
        <ProgressChart
          data={progressData}
          exerciseName={selectedExerciseName}
        />
        <ExerciseProgress
          data={volumeData}
          exerciseName={selectedExerciseName}
        />
      </div>
      <MuscleGroupReport
        data={muscleGroupData}
        muscleGroups={muscleGroups}
      />
    </div>
  );
}
