"use client";

import { useState } from "react";
import { Plus, CalendarCheck, CalendarClock, Dumbbell, Loader2 } from "lucide-react";
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
import { reorderPlanItems, addRoutineToPlan } from "../actions";
import { createClient } from "@/lib/supabase/client";
import type {
  DailyPlanItemWithWorkout,
  ExerciseTargets,
  WorkoutGroup,
} from "@/lib/types";

interface TodayPlanListProps {
  initialPlanItems: DailyPlanItemWithWorkout[];
  routines: (WorkoutGroup & { workout_group_items: { count: number }[] })[];
  targetsByKey?: Record<string, ExerciseTargets>;
  scheduledRoutine?: { id: string; name: string } | null;
  viewingUserId: string;
  isPartnerView?: boolean;
  canEdit?: boolean;
}

export function TodayPlanList({
  initialPlanItems,
  routines,
  targetsByKey = {},
  scheduledRoutine = null,
  viewingUserId,
  isPartnerView = false,
  canEdit = true,
}: TodayPlanListProps) {
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [logSheetOpen, setLogSheetOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<DailyPlanItemWithWorkout | null>(null);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const planKey = ["today-plan", viewingUserId];

  const { data: planItems = initialPlanItems, isLoading } = useQuery({
    queryKey: planKey,
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data, error } = await supabase
        .from("daily_plan_items")
        .select("*, workouts(*, workout_tags(tags(*)))")
        .eq("user_id", viewingUserId)
        .eq("plan_date", today)
        .order("sort_order");

      if (error) throw error;
      return data as DailyPlanItemWithWorkout[];
    },
    initialData: initialPlanItems,
  });

  // Keep a local copy for immediate drag-and-drop feel; sync when query data
  // changes (state adjustment during render — react.dev "You Might Not Need an Effect")
  const [items, setItems] = useState(planItems);
  const [prevPlanItems, setPrevPlanItems] = useState(planItems);
  if (planItems !== prevPlanItems) {
    setPrevPlanItems(planItems);
    setItems(planItems);
  }

  const reorderMutation = useMutation({
    mutationFn: (orderedIds: string[]) => reorderPlanItems(orderedIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: planKey });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to reorder");
      setItems(planItems); // Revert on error
    },
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const applyScheduledMutation = useMutation({
    mutationFn: (groupId: string) => addRoutineToPlan(groupId),
    onSuccess: (result) => {
      if ("error" in result) {
        toast.error(result.error);
      } else {
        toast.success("Routine added to today's plan!");
        queryClient.invalidateQueries({ queryKey: planKey });
      }
    },
    onError: () => toast.error("Failed to add routine"),
  });

  // Hide the banner once the scheduled routine is already in the plan
  const scheduledApplied =
    !!scheduledRoutine &&
    items.some((i) => i.source_group_id === scheduledRoutine.id);

  const scheduledBanner = !isPartnerView && scheduledRoutine && !scheduledApplied && (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3"
    >
      <CalendarClock className="h-5 w-5 shrink-0 text-primary" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">
          Scheduled today: {scheduledRoutine.name}
        </p>
        <p className="text-xs text-muted-foreground">From your weekly schedule</p>
      </div>
      <Button
        size="sm"
        onClick={() => applyScheduledMutation.mutate(scheduledRoutine.id)}
        disabled={applyScheduledMutation.isPending}
      >
        {applyScheduledMutation.isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "Apply"
        )}
      </Button>
    </motion.div>
  );

  const getTargets = (item: DailyPlanItemWithWorkout) =>
    item.source_group_id
      ? targetsByKey[`${item.source_group_id}:${item.workout_id}`] ?? null
      : null;

  const completedCount = items.filter((i) => i.is_completed).length;
  const totalCount = items.length;
  const progressPercent = totalCount > 0 ? (completedCount / totalCount) * 100 : 0;

  // In partner view, anything beyond viewing requires their edit permission
  const canLog = !isPartnerView || canEdit;
  const canAdd = !isPartnerView || canEdit; // add routines / workouts, remove items
  const canReorder = !isPartnerView; // drag-reorder stays on your own plan
  const addForUserId = isPartnerView ? viewingUserId : undefined;

  const handleLogSets = (item: DailyPlanItemWithWorkout) => {
    setSelectedItem(item);
    setLogSheetOpen(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!canReorder) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex);

    setItems(reordered);
    reorderMutation.mutate(reordered.map((i) => i.id));
  };

  if (items.length === 0 && !isLoading) {
    if (isPartnerView) {
      return (
        <>
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed p-12 text-center">
            <Dumbbell className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No workouts planned for today.
            </p>
            {canAdd && (
              <Button onClick={() => setAddSheetOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Workout
              </Button>
            )}
          </div>
          {canAdd && (
            <AddWorkoutSheet
              open={addSheetOpen}
              onOpenChange={setAddSheetOpen}
              routines={routines}
              viewingUserId={viewingUserId}
              forUserId={addForUserId}
            />
          )}
        </>
      );
    }
    return (
      <>
        {scheduledBanner}
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
          viewingUserId={viewingUserId}
          forUserId={addForUserId}
        />
      </>
    );
  }

  return (
    <>
      {scheduledBanner}

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
          disabled={!canReorder}
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
                  <SortableItem id={item.id} disabled={!canReorder}>
                    <TodayPlanItemCard
                      item={item}
                      index={index}
                      onLogSets={handleLogSets}
                      viewingUserId={viewingUserId}
                      forUserId={addForUserId}
                      canLog={canLog}
                      canRemove={canAdd}
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
      {canAdd && (
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
      )}

      {/* Sheets */}
      {canAdd && (
        <AddWorkoutSheet
          open={addSheetOpen}
          onOpenChange={setAddSheetOpen}
          routines={routines}
          viewingUserId={viewingUserId}
          forUserId={addForUserId}
        />
      )}
      <TodayLogSetSheet
        item={selectedItem}
        targets={selectedItem ? getTargets(selectedItem) : null}
        open={logSheetOpen}
        onOpenChange={setLogSheetOpen}
        viewingUserId={viewingUserId}
        forUserId={isPartnerView ? viewingUserId : undefined}
      />
    </>
  );
}
