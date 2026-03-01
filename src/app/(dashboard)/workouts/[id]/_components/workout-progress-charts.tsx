"use client";

import { TrendingUp } from "lucide-react";
import { ProgressChart } from "@/app/(dashboard)/reports/_components/progress-chart";
import { ExerciseProgress } from "@/app/(dashboard)/reports/_components/exercise-progress";

interface WorkoutProgressChartsProps {
  exerciseName: string;
  weightData: { date: string; maxWeight: number }[];
  volumeData: { date: string; volume: number }[];
}

export function WorkoutProgressCharts({
  exerciseName,
  weightData,
  volumeData,
}: WorkoutProgressChartsProps) {
  if (weightData.length === 0 && volumeData.length === 0) return null;

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <TrendingUp className="h-5 w-5" />
        Your Progress
      </h2>
      <div className="grid gap-4 md:grid-cols-2">
        <ProgressChart data={weightData} exerciseName={exerciseName} />
        <ExerciseProgress data={volumeData} exerciseName={exerciseName} />
      </div>
    </section>
  );
}
