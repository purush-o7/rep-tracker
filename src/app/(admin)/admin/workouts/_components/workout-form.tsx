"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { workoutSchema, type WorkoutInput } from "@/lib/validators/workout";
import { createWorkout, updateWorkout } from "../actions";
import { TagSelect } from "./tag-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tag, Workout, WorkoutTag } from "@/lib/types";

interface WorkoutFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tags: Tag[];
  workout?: Workout & { workout_tags: (WorkoutTag & { tags: Tag })[] };
}

export function WorkoutForm({
  open,
  onOpenChange,
  tags,
  workout,
}: WorkoutFormProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!workout;

  const form = useForm<WorkoutInput>({
    resolver: zodResolver(workoutSchema),
    defaultValues: {
      name: workout?.name ?? "",
      description: workout?.description ?? "",
      tag_ids: workout?.workout_tags?.map((wt) => wt.tag_id) ?? [],
    },
  });

  const onSubmit = async (data: WorkoutInput) => {
    setLoading(true);
    const result = isEditing
      ? await updateWorkout(workout.id, data)
      : await createWorkout(data);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(isEditing ? "Workout updated" : "Workout created");
      onOpenChange(false);
      form.reset();
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Workout" : "Create Workout"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g. Bench Press" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Describe the exercise..."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="tag_ids"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Muscle Groups</FormLabel>
                  <TagSelect
                    tags={tags}
                    selected={field.value}
                    onChange={field.onChange}
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" className="w-full" disabled={loading}>
              {loading
                ? "Saving..."
                : isEditing
                  ? "Update Workout"
                  : "Create Workout"}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
