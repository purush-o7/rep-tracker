"use client";

import Image from "next/image";
import Link from "next/link";
import { Dumbbell, Youtube, Plus } from "lucide-react";
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

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

export function WorkoutCard({ workout, onLog }: WorkoutCardProps) {
  const youtubeThumbnail = workout.youtube_url
    ? getYoutubeThumbnail(workout.youtube_url)
    : null;

  const imageUrl = youtubeThumbnail
    ? null
    : workout.workout_images?.[0]
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/workout-images/${workout.workout_images[0].storage_path}`
      : null;

  const displayImage = youtubeThumbnail ?? imageUrl;

  return (
    <Card className="flex flex-col transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative aspect-video overflow-hidden rounded-t-lg">
        {displayImage ? (
          <>
            <Image
              src={displayImage}
              alt={workout.name}
              fill
              className="object-cover"
              {...(youtubeThumbnail ? { unoptimized: true } : {})}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            {youtubeThumbnail && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-600/90">
                  <Youtube className="h-5 w-5 text-white" />
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <Dumbbell className="h-12 w-12 text-primary/30" />
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
      <CardContent className="flex-1 space-y-2 pb-2">
        <div className="flex flex-wrap gap-1">
          {workout.workout_tags.map((wt) => (
            <Badge key={wt.tag_id} variant="secondary" className="text-xs">
              {wt.tags.name}
            </Badge>
          ))}
        </div>
        {workout.youtube_url && (
          <div className="flex items-center gap-1 text-xs text-red-500">
            <Youtube className="h-3.5 w-3.5" />
            <span>Video tutorial</span>
          </div>
        )}
      </CardContent>
      <CardFooter>
        <Button className="w-full" onClick={onLog}>
          <Plus className="mr-1.5 h-4 w-4" />
          Log Workout
        </Button>
      </CardFooter>
    </Card>
  );
}
