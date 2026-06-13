"use client";

import { useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  Dumbbell,
  Youtube,
  Plus,
  CalendarPlus,
  Loader2,
  Trophy,
  Timer,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MuscleTags } from "@/components/muscle-tags";
import { SchemeTag } from "@/components/scheme-tag";
import { addWorkoutToPlan } from "@/app/(dashboard)/today/actions";
import { formatDuration, formatDistance } from "@/lib/set-entry";
import type { WorkoutWithTags } from "@/lib/types";

export interface WorkoutCardStats {
  sessions: number;
  lastPerformed: string | null;
  bestWeight: number;
  bestDuration: number;
  bestDistance: number;
}

interface WorkoutCardProps {
  workout: WorkoutWithTags;
  stats?: WorkoutCardStats;
  creator?: { full_name: string | null; handle: string | null };
  onLog: () => void;
}

function getYoutubeThumbnail(url: string): string | null {
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

export function WorkoutCard({ workout, stats, creator, onLog }: WorkoutCardProps) {
  const creatorLabel = creator
    ? creator.handle
      ? `@${creator.handle}`
      : creator.full_name ?? "a member"
    : null;
  const [isAdding, startAdding] = useTransition();

  const handleAddToToday = () => {
    startAdding(async () => {
      const result = await addWorkoutToPlan(workout.id);
      if ("error" in result) toast.error(result.error);
      else if (result.data) toast.success(`${workout.name} added to today`);
      else toast.info(`${workout.name} is already in today's plan`);
    });
  };

  const youtubeThumbnail = workout.youtube_url
    ? getYoutubeThumbnail(workout.youtube_url)
    : null;
  const imageUrl = youtubeThumbnail
    ? null
    : workout.workout_images?.[0]
      ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/workout-images/${workout.workout_images[0].storage_path}`
      : null;
  const displayImage = youtubeThumbnail ?? imageUrl;

  // Personal best, formatted per log type
  let bestLabel: string | null = null;
  let BestIcon = Trophy;
  if (stats && stats.sessions > 0) {
    if (workout.log_type === "duration" && stats.bestDuration > 0) {
      bestLabel = formatDuration(stats.bestDuration);
      BestIcon = Timer;
    } else if (workout.log_type === "distance" && stats.bestDistance > 0) {
      bestLabel = formatDistance(stats.bestDistance);
      BestIcon = MapPin;
    } else if (stats.bestWeight > 0) {
      bestLabel = `${stats.bestWeight} kg`;
      BestIcon = Trophy;
    }
  }

  return (
    <Card className="flex flex-row overflow-hidden p-0 transition-all duration-200 hover:shadow-md">
      {/* Thumbnail */}
      <Link
        href={`/workouts/${workout.id}`}
        className="relative w-24 shrink-0 self-stretch sm:w-28"
      >
        {displayImage ? (
          <>
            <Image
              src={displayImage}
              alt={workout.name}
              fill
              className="object-cover"
              sizes="112px"
              {...(youtubeThumbnail ? { unoptimized: true } : {})}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
            {youtubeThumbnail && (
              <span className="absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-red-600/90">
                <Youtube className="h-3.5 w-3.5 text-white" />
              </span>
            )}
          </>
        ) : (
          <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
            <Dumbbell className="h-8 w-8 text-primary/30" />
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-3">
        <Link
          href={`/workouts/${workout.id}`}
          className="truncate font-semibold leading-tight hover:underline"
        >
          {workout.name}
        </Link>

        {workout.description && (
          <p className="truncate text-xs text-muted-foreground">
            {workout.description}
          </p>
        )}

        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <MuscleTags tags={workout.workout_tags} max={3} />
          <SchemeTag sets={workout.default_sets} reps={workout.default_reps} />
        </div>

        {creatorLabel && (
          <span className="text-[11px] text-muted-foreground">
            Added by{" "}
            <span className="font-medium text-foreground">{creatorLabel}</span>
          </span>
        )}

        {/* Personal stats line */}
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          {stats && stats.sessions > 0 ? (
            <>
              <span className="font-medium text-foreground">
                {stats.sessions}×
              </span>
              {bestLabel && (
                <span className="inline-flex items-center gap-1">
                  <BestIcon className="h-3 w-3 text-amber-500" />
                  {bestLabel}
                </span>
              )}
              {stats.lastPerformed && (
                <span className="truncate">
                  · {format(new Date(stats.lastPerformed), "MMM d")}
                </span>
              )}
            </>
          ) : (
            <span className="italic">Not logged yet</span>
          )}
        </div>

        {/* Actions */}
        <div className="mt-auto flex gap-2 pt-1.5">
          <Button size="sm" className="flex-1" onClick={onLog}>
            <Plus className="mr-1 h-3.5 w-3.5" />
            Log
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleAddToToday}
            disabled={isAdding}
            aria-label="Add to today's plan"
            title="Add to today's plan"
          >
            {isAdding ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}
