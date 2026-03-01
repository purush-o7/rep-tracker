"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, X, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutPicker } from "./workout-picker";
import { createWorkoutGroup, updateWorkoutGroup } from "../actions";
import type { Workout, WorkoutGroupWithItems } from "@/lib/types";

interface RoutineFormProps {
  workouts: Workout[];
  editGroup?: WorkoutGroupWithItems;
}

export function RoutineForm({ workouts, editGroup }: RoutineFormProps) {
  const router = useRouter();
  const isEditing = !!editGroup;

  const [name, setName] = useState(editGroup?.name ?? "");
  const [description, setDescription] = useState(
    editGroup?.description ?? ""
  );
  const [selectedWorkoutIds, setSelectedWorkoutIds] = useState<string[]>(
    editGroup
      ? editGroup.workout_group_items
          .sort((a, b) => a.sort_order - b.sort_order)
          .map((item) => item.workout_id)
      : []
  );
  const [loading, setLoading] = useState(false);

  const toggleWorkout = (workoutId: string) => {
    setSelectedWorkoutIds((prev) =>
      prev.includes(workoutId)
        ? prev.filter((id) => id !== workoutId)
        : [...prev, workoutId]
    );
  };

  const removeWorkout = (workoutId: string) => {
    setSelectedWorkoutIds((prev) => prev.filter((id) => id !== workoutId));
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
      items: selectedWorkoutIds.map((id, i) => ({
        workout_id: id,
        sort_order: i,
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
        </CardHeader>
        <CardContent className="space-y-3">
          {selectedWorkoutIds.length > 0 && (
            <div className="space-y-2">
              {selectedWorkoutIds.map((id, i) => (
                <div
                  key={id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-medium">
                    {i + 1}
                  </span>
                  <Dumbbell className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="flex-1 truncate text-sm font-medium">
                    {getWorkoutName(id)}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={() => removeWorkout(id)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
          {selectedWorkoutIds.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">
              No workouts added yet. Use the picker below to add exercises.
            </p>
          )}
          <WorkoutPicker
            workouts={workouts}
            selectedIds={selectedWorkoutIds}
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
