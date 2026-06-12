"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Dumbbell } from "lucide-react";
import { toast } from "sonner";
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
import { SortableItem } from "@/components/sortable-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutPicker } from "./workout-picker";
import { createWorkoutGroup, updateWorkoutGroup } from "../actions";
import type { Workout, WorkoutGroupWithItems } from "@/lib/types";

interface RoutineFormProps {
  workouts: Workout[];
  editGroup?: WorkoutGroupWithItems;
}

interface RoutineItem {
  workout_id: string;
  target_sets: number | null;
  target_reps: number | null;
  target_weight_kg: number | null;
}

export function RoutineForm({ workouts, editGroup }: RoutineFormProps) {
  const router = useRouter();
  const isEditing = !!editGroup;

  const [name, setName] = useState(editGroup?.name ?? "");
  const [description, setDescription] = useState(
    editGroup?.description ?? ""
  );
  const [items, setItems] = useState<RoutineItem[]>(
    editGroup
      ? [...editGroup.workout_group_items]
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => ({
            workout_id: item.workout_id,
            target_sets: item.target_sets,
            target_reps: item.target_reps,
            target_weight_kg: item.target_weight_kg,
          }))
      : []
  );
  const [loading, setLoading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } })
  );

  const selectedIds = items.map((i) => i.workout_id);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    setItems((prev) => {
      const oldIndex = prev.findIndex((i) => i.workout_id === active.id);
      const newIndex = prev.findIndex((i) => i.workout_id === over.id);
      return arrayMove(prev, oldIndex, newIndex);
    });
  };

  const toggleWorkout = (workoutId: string) => {
    setItems((prev) =>
      prev.some((i) => i.workout_id === workoutId)
        ? prev.filter((i) => i.workout_id !== workoutId)
        : [
            ...prev,
            {
              workout_id: workoutId,
              target_sets: null,
              target_reps: null,
              target_weight_kg: null,
            },
          ]
    );
  };

  const removeWorkout = (workoutId: string) => {
    setItems((prev) => prev.filter((i) => i.workout_id !== workoutId));
  };

  const updateTarget = (
    workoutId: string,
    field: "target_sets" | "target_reps" | "target_weight_kg",
    value: number | null
  ) => {
    setItems((prev) =>
      prev.map((i) =>
        i.workout_id === workoutId ? { ...i, [field]: value } : i
      )
    );
  };

  const getWorkoutName = (id: string) =>
    workouts.find((w) => w.id === id)?.name ?? "Unknown";

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast.error("Name is required");
      return;
    }

    setLoading(true);
    const payload = {
      name: name.trim(),
      description: description.trim() || undefined,
      items: items.map((item, i) => ({
        workout_id: item.workout_id,
        sort_order: i,
        target_sets: item.target_sets,
        target_reps: item.target_reps,
        target_weight_kg: item.target_weight_kg,
      })),
    };

    const result = isEditing
      ? await updateWorkoutGroup(editGroup.id, payload)
      : await createWorkoutGroup(payload);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isEditing ? "Routine updated!" : "Routine created!");
      router.push("/routines");
    }
    setLoading(false);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="routine-name">Name</Label>
            <Input
              id="routine-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Push Day, Upper Body, Leg Day"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="routine-desc">Description (optional)</Label>
            <Textarea
              id="routine-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your routine..."
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Workouts</CardTitle>
          <p className="text-sm text-muted-foreground">
            Optionally set targets per exercise — they prefill the log form.
          </p>
        </CardHeader>
        <CardContent className="space-y-3">
          {items.length > 0 && (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={selectedIds}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-2">
                  {items.map((item, i) => (
                    <SortableItem key={item.workout_id} id={item.workout_id}>
                      <div className="space-y-2 rounded-lg border p-3">
                        <div className="flex items-center gap-3">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                            {i + 1}
                          </span>
                          <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
                          <span className="flex-1 truncate text-sm font-medium">
                            {getWorkoutName(item.workout_id)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => removeWorkout(item.workout_id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="grid grid-cols-3 gap-2 pl-9">
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Sets
                            </Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="—"
                              min={1}
                              max={20}
                              value={item.target_sets ?? ""}
                              onChange={(e) =>
                                updateTarget(
                                  item.workout_id,
                                  "target_sets",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="h-9 text-base md:text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Reps
                            </Label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              pattern="[0-9]*"
                              placeholder="—"
                              min={1}
                              max={99}
                              value={item.target_reps ?? ""}
                              onChange={(e) =>
                                updateTarget(
                                  item.workout_id,
                                  "target_reps",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="h-9 text-base md:text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase tracking-wide text-muted-foreground">
                              Weight (kg)
                            </Label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="—"
                              min={0}
                              step={0.5}
                              value={item.target_weight_kg ?? ""}
                              onChange={(e) =>
                                updateTarget(
                                  item.workout_id,
                                  "target_weight_kg",
                                  e.target.value ? Number(e.target.value) : null
                                )
                              }
                              className="h-9 text-base md:text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    </SortableItem>
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
          {items.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No workouts added yet. Use the picker below to add exercises.
            </p>
          )}
          <WorkoutPicker
            workouts={workouts}
            selectedIds={selectedIds}
            onSelect={toggleWorkout}
          />
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="outline"
          className="flex-1"
          onClick={() => router.push("/routines")}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={loading}
        >
          <Save className="mr-2 h-4 w-4" />
          {loading
            ? "Saving..."
            : isEditing
              ? "Update Routine"
              : "Create Routine"}
        </Button>
      </div>
    </div>
  );
}
