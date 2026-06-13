"use client";

import { useState } from "react";
import { ListPlus, Search, FolderOpen, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ResponsiveSheetDrawer } from "@/components/responsive-sheet-drawer";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { addRoutineToPlan, addWorkoutToPlan } from "../actions";
import { createClient } from "@/lib/supabase/client";
import { useDebounce } from "@/hooks/use-debounce";
import { MuscleTags } from "@/components/muscle-tags";
import { SchemeTag } from "@/components/scheme-tag";
import type { Workout, WorkoutGroup } from "@/lib/types";

interface AddWorkoutSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routines: (WorkoutGroup & { workout_group_items: { count: number }[] })[];
  /** Whose plan we're viewing — used for the cache key */
  viewingUserId: string;
  /** Set when adding to a partner's plan */
  forUserId?: string;
}

export function AddWorkoutSheet({
  open,
  onOpenChange,
  routines,
  viewingUserId,
  forUserId,
}: AddWorkoutSheetProps) {
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounce(search, 300);
  const queryClient = useQueryClient();
  const supabase = createClient();
  const planKey = ["today-plan", viewingUserId];
  const target = forUserId ? "your partner's plan" : "today's plan";

  // Fetch workouts with TanStack Query
  const { data: workouts = [], isLoading: isSearching } = useQuery({
    queryKey: ["workouts", debouncedSearch],
    queryFn: async () => {
      let query = supabase
        .from("workouts")
        .select("id, name, default_sets, default_reps, workout_tags(tags(name))")
        .order("name")
        .limit(20);

      if (debouncedSearch) {
        query = query.ilike("name", `%${debouncedSearch}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as unknown as (Pick<
        Workout,
        "id" | "name" | "default_sets" | "default_reps"
      > & {
        workout_tags: { tags: { name: string } | null }[];
      })[];
    },
    enabled: open, // Only fetch when sheet is open
  });

  // Mutation for adding a routine
  const routineMutation = useMutation({
    mutationFn: (groupId: string) => addRoutineToPlan(groupId, forUserId),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Routine added to ${target}`);
        queryClient.invalidateQueries({ queryKey: planKey });
      }
    },
  });

  // Mutation for adding a single workout
  const workoutMutation = useMutation({
    mutationFn: (workoutId: string) => addWorkoutToPlan(workoutId, forUserId),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success(`Workout added to ${target}`);
        queryClient.invalidateQueries({ queryKey: planKey });
      }
    },
  });

  return (
    <ResponsiveSheetDrawer
      open={open}
      onOpenChange={onOpenChange}
      title="Add Workout"
      description="Add from a routine or pick individual workouts"
      icon={<ListPlus className="h-5 w-5 text-primary" />}
    >
      <Tabs defaultValue="routine" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="routine">From Routine</TabsTrigger>
          <TabsTrigger value="individual">Individual</TabsTrigger>
        </TabsList>

        <TabsContent value="routine" className="mt-4 space-y-2">
          {routines.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
              <FolderOpen className="h-8 w-8" />
              <p className="text-sm">No routines yet</p>
              <p className="text-xs">
                Create routines in My Routines to quickly load workouts here
              </p>
            </div>
          ) : (
            routines.map((routine) => {
              const itemCount = routine.workout_group_items[0]?.count ?? 0;
              const isPending = routineMutation.variables === routine.id && routineMutation.isPending;
              
              return (
                <button
                  key={routine.id}
                  className="flex w-full items-center justify-between rounded-lg border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-50"
                  onClick={() => routineMutation.mutate(routine.id)}
                  disabled={isPending}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {routine.name}
                    </p>
                    {routine.description && (
                      <p className="text-xs text-muted-foreground truncate">
                        {routine.description}
                      </p>
                    )}
                  </div>
                  <span className="ml-2 shrink-0 rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                    {itemCount} {itemCount === 1 ? "exercise" : "exercises"}
                  </span>
                  {isPending && (
                    <Loader2 className="ml-2 h-4 w-4 animate-spin text-muted-foreground" />
                  )}
                </button>
              );
            })
          )}
        </TabsContent>

        <TabsContent value="individual" className="mt-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search workouts..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
            )}
          </div>
          <div className="max-h-[50vh] space-y-1 overflow-y-auto">
            {workouts.length === 0 && !isSearching ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No workouts found
              </p>
            ) : (
              workouts.map((workout) => {
                const isPending = workoutMutation.variables === workout.id && workoutMutation.isPending;
                return (
                  <div
                    key={workout.id}
                    className="flex items-center justify-between rounded-lg px-3 py-2 hover:bg-muted/50"
                  >
                    <div className="mr-2 min-w-0 flex-1">
                      <span className="block truncate text-sm">{workout.name}</span>
                      <div className="flex flex-wrap items-center gap-x-2">
                        <MuscleTags tags={workout.workout_tags} max={3} />
                        <SchemeTag
                          sets={workout.default_sets}
                          reps={workout.default_reps}
                        />
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => workoutMutation.mutate(workout.id)}
                      disabled={isPending}
                      className="shrink-0"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        "Add"
                      )}
                    </Button>
                  </div>
                );
              })
            )}
          </div>
        </TabsContent>
      </Tabs>
    </ResponsiveSheetDrawer>
  );
}
