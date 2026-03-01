"use client";

import { useState, useMemo } from "react";
import { Dumbbell } from "lucide-react";
import { WorkoutCard } from "./workout-card";
import { WorkoutSearch } from "./workout-search";
import { LogWorkoutDialog } from "./log-workout-dialog";
import type { Tag, Workout, WorkoutWithTags } from "@/lib/types";

interface WorkoutCatalogProps {
  workouts: WorkoutWithTags[];
  tags: Tag[];
  partners?: { id: string; full_name: string | null }[];
}

export function WorkoutCatalog({ workouts, tags, partners }: WorkoutCatalogProps) {
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [logWorkout, setLogWorkout] = useState<Workout | null>(null);

  const filtered = useMemo(() => {
    return workouts.filter((w) => {
      const matchesSearch = w.name
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesTag = selectedTag
        ? w.workout_tags.some((wt) => wt.tag_id === selectedTag)
        : true;
      return matchesSearch && matchesTag;
    });
  }, [workouts, search, selectedTag]);

  return (
    <>
      <WorkoutSearch
        search={search}
        onSearchChange={setSearch}
        tags={tags}
        selectedTag={selectedTag}
        onTagChange={setSelectedTag}
      />
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
          <Dumbbell className="mb-4 h-12 w-12" />
          <p className="text-lg font-medium">No workouts found</p>
          <p className="text-sm">Try adjusting your search or filters</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((workout) => (
            <WorkoutCard
              key={workout.id}
              workout={workout}
              onLog={() => setLogWorkout(workout)}
            />
          ))}
        </div>
      )}
      <LogWorkoutDialog
        workout={logWorkout}
        open={!!logWorkout}
        onOpenChange={(open) => !open && setLogWorkout(null)}
        partners={partners}
      />
    </>
  );
}
