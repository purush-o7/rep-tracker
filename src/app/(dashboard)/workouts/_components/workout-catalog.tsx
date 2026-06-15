"use client";

import { useState, useMemo } from "react";
import { Dumbbell } from "lucide-react";
import { WorkoutCard, type WorkoutCardStats } from "./workout-card";
import { WorkoutSearch } from "./workout-search";
import { LogWorkoutDialog } from "./log-workout-dialog";
import { AddCustomWorkoutDialog } from "./add-custom-workout-dialog";
import { DataPagination } from "@/components/data-pagination";
import type { Tag, Workout, WorkoutWithTags } from "@/lib/types";

export interface WorkoutCreator {
  full_name: string | null;
  handle: string | null;
}

interface WorkoutCatalogProps {
  workouts: WorkoutWithTags[];
  tags: Tag[];
  partners?: { id: string; full_name: string | null }[];
  statsByWorkout?: Record<string, WorkoutCardStats>;
  creatorById?: Record<string, WorkoutCreator>;
  initialSearch: string;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export function WorkoutCatalog({
  workouts,
  tags,
  partners,
  statsByWorkout,
  creatorById,
  initialSearch,
  currentPage,
  pageSize,
  totalCount,
  totalPages,
}: WorkoutCatalogProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [logWorkout, setLogWorkout] = useState<Workout | null>(null);

  // Tag filtering stays client-side (Supabase can't filter parent rows by nested join columns)
  const filtered = useMemo(() => {
    if (!selectedTag) return workouts;
    return workouts.filter((w) =>
      w.workout_tags.some((wt) => wt.tag_id === selectedTag)
    );
  }, [workouts, selectedTag]);

  return (
    <>
      <WorkoutSearch
        tags={tags}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
        initialSearch={initialSearch}
        action={<AddCustomWorkoutDialog tags={tags} />}
      />
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Dumbbell className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">No workouts found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              stats={statsByWorkout?.[workout.id]}
              creator={
                workout.created_by
                  ? creatorById?.[workout.created_by]
                  : undefined
              }
              onLog={() => setLogWorkout(workout)}
            />
          ))}
        </div>
      )}
      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
      />
      <LogWorkoutDialog
        workout={logWorkout}
        open={!!logWorkout}
        onOpenChange={(open) => !open && setLogWorkout(null)}
        partners={partners}
      />
    </>
  );
}
