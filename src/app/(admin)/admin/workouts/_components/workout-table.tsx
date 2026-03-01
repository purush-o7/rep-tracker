"use client";

import { useState } from "react";
import { Pencil, Trash2, ImagePlus } from "lucide-react";
import { toast } from "sonner";
import { deleteWorkout } from "../actions";
import { WorkoutForm } from "./workout-form";
import { ImageUpload } from "./image-upload";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Tag, WorkoutWithTags } from "@/lib/types";

interface WorkoutTableProps {
  workouts: WorkoutWithTags[];
  tags: Tag[];
}

export function WorkoutTable({ workouts, tags }: WorkoutTableProps) {
  const [editWorkout, setEditWorkout] = useState<WorkoutWithTags | null>(null);
  const [imageWorkout, setImageWorkout] = useState<WorkoutWithTags | null>(null);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const handleDelete = async (id: string) => {
    const result = await deleteWorkout(id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Workout deleted");
    }
  };

  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Images</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {workouts.map((workout) => (
              <TableRow key={workout.id}>
                <TableCell className="font-medium">{workout.name}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap gap-1">
                    {workout.workout_tags.map((wt) => (
                      <Badge key={wt.tag_id} variant="secondary">
                        {wt.tags.name}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>{workout.workout_images?.length ?? 0}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setImageWorkout(workout)}
                    >
                      <ImagePlus className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditWorkout(workout)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(workout.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {workouts.map((workout) => (
          <Card key={workout.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">{workout.name}</CardTitle>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setImageWorkout(workout)}
                  >
                    <ImagePlus className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditWorkout(workout)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => handleDelete(workout.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-1">
                {workout.workout_tags.map((wt) => (
                  <Badge key={wt.tag_id} variant="secondary">
                    {wt.tags.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {editWorkout && (
        <WorkoutForm
          open={!!editWorkout}
          onOpenChange={() => setEditWorkout(null)}
          tags={tags}
          workout={editWorkout}
        />
      )}

      <Dialog open={!!imageWorkout} onOpenChange={() => setImageWorkout(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Images - {imageWorkout?.name}</DialogTitle>
          </DialogHeader>
          {imageWorkout && (
            <ImageUpload
              workoutId={imageWorkout.id}
              images={imageWorkout.workout_images ?? []}
              supabaseUrl={supabaseUrl}
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
