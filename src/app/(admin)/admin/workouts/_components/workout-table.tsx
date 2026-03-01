"use client";

import { useState } from "react";
import { Pencil, Trash2, ImagePlus, Youtube } from "lucide-react";
import { toast } from "sonner";
import { deleteWorkout } from "../actions";
import { WorkoutForm } from "./workout-form";
import { ImageUpload } from "./image-upload";
import { SearchInput } from "@/components/search-input";
import { DataPagination } from "@/components/data-pagination";
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
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export function WorkoutTable({
  workouts,
  tags,
  currentPage,
  pageSize,
  totalCount,
  totalPages,
}: WorkoutTableProps) {
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
      <SearchInput placeholder="Search workouts..." />

      {/* Desktop table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Tags</TableHead>
              <TableHead>Media</TableHead>
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
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span>{workout.workout_images?.length ?? 0} img</span>
                    {workout.youtube_url && (
                      <a
                        href={workout.youtube_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-red-500 hover:text-red-600"
                      >
                        <Youtube className="h-4 w-4" />
                      </a>
                    )}
                  </div>
                </TableCell>
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
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-1">
                {workout.workout_tags.map((wt) => (
                  <Badge key={wt.tag_id} variant="secondary">
                    {wt.tags.name}
                  </Badge>
                ))}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{workout.workout_images?.length ?? 0} images</span>
                {workout.youtube_url && (
                  <a
                    href={workout.youtube_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-red-500"
                  >
                    <Youtube className="h-3.5 w-3.5" />
                    YouTube
                  </a>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <DataPagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalCount={totalCount}
        pageSize={pageSize}
      />

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
