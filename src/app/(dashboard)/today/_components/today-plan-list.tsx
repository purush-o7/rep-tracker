"use client";

import { useState, useEffect, useTransition } from "react";
import { Plus, CalendarCheck, Dumbbell, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { SortableItem } from "@/components/sortable-item";
import { TodayPlanItemCard } from "./today-plan-item-card";
import { AddWorkoutSheet } from "./add-workout-sheet";
import { TodayLogSetSheet } from "./today-log-set-sheet";
import { reorderPlanItems } from "../actions";
import { createClient } from "@/lib/supabase/client";
import type { DailyPlanItemWithWorkout, Workout, WorkoutGroup } from "@/lib/types";

interface TodayPlanListProps {
  initialPlanItems: DailyPlanItemWithWorkout[];
  routines: (WorkoutGroup & { workout_group_items: { count: number }[] })[];
}

export function TodayPlanList({
  initialPlanItems,
  routines,
}: TodayPlanListProps) {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DailyPlanItemWithWorkout | null>(null);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const { data: planItems = initialPlanItems, isLoading } = useQuery({
    queryKey: ["today-plan"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");
      
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_plan_items")
        .select("*, workouts(*)")
        .eq("user_id", user.id)
        .eq("plan_date", today)
        .order("sort_order");

      if (error) throw error;
      return data as DailyPlanItemWithWorkout[];
    },
    initialData: initialPlanItems,
  });

  // Keep a local copy for immediate drag-and-drop feel
  const [items, setItems] = useState(planItems);

  // Sync items when query data changes (e.g., after invalidation)
  useEffect(() => {
    setItems(planItems);
  }, [planItems]);

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderPlanItems(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["today-plan"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to reorder");
      setItems(planItems); // Revert on error
    }
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  const handleLogSets = (item: DailyPlanItemWithWorkout) => {
    setSelectedItem(item);
    setLogSheetOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);
    
    setItems(reordered);
    reorderMutation.mutate(reordered.map((i) => i.id));
  };

  if (items.length === 0 && !isLoading) {
    return (
      <>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center justify-center gap-4 rounded-lg border border-dashed p-12 text-center"
        >
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Dumbbell className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">No workouts planned</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Add workouts from a routine or pick individual exercises to get started
            </p>
          </div>
          <Button onClick={() => setAddSheetOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Workout
          </Button>
        </motion.div>

        <AddWorkoutSheet
          open={addSheetOpen}
          onOpenChange={setAddSheetOpen}
          routines={routines}
        />
      </>
    );
  }

  return (
    <>
      {/* Progress bar */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-2"
      >
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarCheck className="h-4 w-4" />
            <span>
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <AnimatePresence mode="wait">
            {completedCount === totalCount && totalCount > 0 && (
              <motion.span 
                key="all-done"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                className="text-sm font-medium text-green-600 dark:text-green-400"
              >
                All done!
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </motion.div>

      {/* Plan items */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={items.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="space-y-2 mt-4">
            <AnimatePresence mode="popLayout" initial={false}>
              {items.map((item, index) => (
                <motion.div
                  key={item.id}
                  layout
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
                  transition={{ type: "spring", stiffness: 500, damping: 30, mass: 1 }}
                >
                  <SortableItem id={item.id}>
                    <TodayPlanItemCard
                      item={item}
                      index={index}
                      onLogSets={handleLogSets}
                    />
                  </SortableItem>
                </motion.div>
              ))}
            </AnimatePresence>
            {isLoading && items.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            )}
          </div>
        </SortableContext>
      </DndContext>

      {/* Add more button */}
      <motion.div layout className="mt-4">
        <Button
          variant="outline"
          className="w-full border-dashed"
          onClick={() => setAddSheetOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Workout
        </Button>
      </motion.div>

      {/* Sheets */}
      <AddWorkoutSheet
        open={addSheetOpen}
        onOpenChange={setAddSheetOpen}
        routines={routines}
      />
      <TodayLogSetSheet
        item={selectedItem}
        open={logSheetOpen}
        onOpenChange={setLogSheetOpen}
      />
    </>
  );
}
