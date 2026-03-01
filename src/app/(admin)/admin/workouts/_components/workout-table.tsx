"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2, ImagePlus, Youtube, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { deleteWorkout } from "../actions";
import { WorkoutForm } from "./workout-form";
import { ImageUpload } from "./image-upload";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { EmptyState } from "@/components/empty-state";
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

interface WorkoutStats {
  logCount: number;
  uniqueUsers: number;
  lastLogged: string | null;
}

interface WorkoutTableProps {
  workouts: WorkoutWithTags[];
  tags: Tag[];
  workoutStats: Record<string, WorkoutStats>;
  currentPage: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export function WorkoutTable({
  workouts,
  tags,
  workoutStats,
  currentPage,
  pageSize,
  totalCount,
  totalPages,
}: WorkoutTableProps) {
  const [editWorkout, setEditWorkout] = useState<WorkoutWithTags | null>(null);
  const [imageWorkout, setImageWorkout] = useState<WorkoutWithTags | null>(
    null
  );
  const [deleteTarget, setDeleteTarget] = useState<WorkoutWithTags | null>(
    null
  );
  const [deleting, setDeleting] = useState(false);
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const result = await deleteWorkout(deleteTarget.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success("Workout deleted");
    }
    setDeleting(false);
    setDeleteTarget(null);
  };

  const getStats = (id: string) =>
    workoutStats[id] ?? { logCount: 0, uniqueUsers: 0, lastLogged: null };

  if (workouts.length === 0 && totalCount === 0) {
    return (
      <>
        <SearchInput placeholder="Search workouts..." />
        <EmptyState
          icon={Dumbbell}
          title="No workouts found"
          description="Create your first workout to get started."
        />
      </>
    );
  }

  return (
    <>
      <SearchInput placeholder="Search workouts..." />

      {workouts.length === 0 ? (
        <EmptyState
          icon={Dumbbell}
          title="No results"
          description="No workouts match your search. Try a different query."
        />
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Usage</TableHead>
                  <TableHead>Media</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {workouts.map((workout) => {
                  const stats = getStats(workout.id);
                  return (
                    <TableRow key={workout.id}>
                      <TableCell className="font-medium">
                        {workout.name}
                      </TableCell>
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
                        <div className="flex flex-wrap gap-1">
                          <Badge variant="outline">
                            {stats.logCount} log
                            {stats.logCount !== 1 ? "s" : ""}
                          </Badge>
                          <Badge variant="outline">
                            {stats.uniqueUsers} user
                            {stats.uniqueUsers !== 1 ? "s" : ""}
                          </Badge>
                          {stats.lastLogged && (
                            <Badge variant="secondary">
                              {format(new Date(stats.lastLogged), "MMM d")}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span>
                            {workout.workout_images?.length ?? 0} img
                          </span>
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
                            onClick={() => setDeleteTarget(workout)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>

          {/* Mobile card list */}
          <div className="space-y-3 md:hidden">
            {workouts.map((workout) => {
              const stats = getStats(workout.id);
              return (
                <Card key={workout.id}>
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">
                        {workout.name}
                      </CardTitle>
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
                          onClick={() => setDeleteTarget(workout)}
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
                    <div className="flex flex-wrap gap-1">
                      <Badge variant="outline">
                        {stats.logCount} log{stats.logCount !== 1 ? "s" : ""}
                      </Badge>
                      <Badge variant="outline">
                        {stats.uniqueUsers} user
                        {stats.uniqueUsers !== 1 ? "s" : ""}
                      </Badge>
                      {stats.lastLogged && (
                        <Badge variant="secondary">
                          {format(new Date(stats.lastLogged), "MMM d")}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>
                        {workout.workout_images?.length ?? 0} images
                      </span>
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
              );
            })}
          </div>
        </>
      )}

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

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        title="Delete Workout"
        description={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
        loading={deleting}
      />
    </>
  );
}
