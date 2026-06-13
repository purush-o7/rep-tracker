"use client";

import { useMemo, useRef, useState } from "react";
import { Search, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { MuscleTags } from "@/components/muscle-tags";
import { SchemeTag } from "@/components/scheme-tag";
import type { TaggedWorkout } from "@/lib/types";

interface RoutineWorkoutSearchProps {
  workouts: TaggedWorkout[];
  selectedIds: string[];
  onAdd: (workoutId: string) => void;
}

export function RoutineWorkoutSearch({
  workouts,
  selectedIds,
  onAdd,
}: RoutineWorkoutSearchProps) {
  const [search, setSearch] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return workouts
      .filter((w) => !selectedIds.includes(w.id))
      .filter((w) => (q ? w.name.toLowerCase().includes(q) : true))
      .slice(0, 12);
  }, [workouts, selectedIds, search]);

  const handleAdd = (id: string) => {
    onAdd(id);
    // Select the current query so the next exercise name types right over it
    requestAnimationFrame(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    });
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="Search exercises to add..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>
      <div className="max-h-[300px] space-y-1 overflow-y-auto">
        {results.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            {search ? "No exercises found" : "All exercises added"}
          </p>
        ) : (
          results.map((w) => (
            <div
              key={w.id}
              className="flex items-center justify-between gap-2 rounded-lg px-3 py-2 hover:bg-muted/50"
            >
              <div className="min-w-0 flex-1">
                <span className="block truncate text-sm">{w.name}</span>
                <div className="flex flex-wrap items-center gap-x-2">
                  <MuscleTags tags={w.workout_tags} max={3} />
                  <SchemeTag sets={w.default_sets} reps={w.default_reps} />
                </div>
              </div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="shrink-0"
                onClick={() => handleAdd(w.id)}
              >
                <Plus className="mr-1 h-4 w-4" />
                Add
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
