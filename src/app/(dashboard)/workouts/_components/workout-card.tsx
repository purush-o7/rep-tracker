"use client";

import Image from "next/image";
import Link from "next/link";
import { Dumbbell } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { WorkoutWithTags } from "@/lib/types";

interface WorkoutCardProps {
  workout: WorkoutWithTags;
  onLog: () => void;
}

export function WorkoutCard({ workout, onLog }: WorkoutCardProps) {
  const imageUrl = workout.workout_images?.[0]
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/workout-images/${workout.workout_images[0].storage_path}`
    : null;

  return (
    <Card className="flex flex-col">
      <div className="relative aspect-video overflow-hidden rounded-t-lg bg-muted">
        {imageUrl ? (
          <Image
            src={imageUrl}
            alt={workout.name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <Dumbbell className="h-12 w-12 text-muted-foreground/50" />
          </div>
        )}
      </div>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">
          <Link
            href={`/workouts/${workout.id}`}
            className="hover:underline"
          >
            {workout.name}
          </Link>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 pb-2">
        <div className="flex flex-wrap gap-1">
          {workout.workout_tags.map((wt) => (
            <Badge key={wt.tag_id} variant="secondary" className="text-xs">
              {wt.tags.name}
            </Badge>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onLog}>
          Log Workout
        </Button>
      </CardFooter>
    </Card>
  );
}
