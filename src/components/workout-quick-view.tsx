"use client";

import Image from "next/image";
import Link from "next/link";
import { Dumbbell, Youtube, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ResponsiveSheetDrawer } from "@/components/responsive-sheet-drawer";
import { MuscleTags } from "@/components/muscle-tags";
import { SchemeTag } from "@/components/scheme-tag";
import type { Workout, Tag } from "@/lib/types";

type QuickViewWorkout = Workout & { workout_tags: { tags: Tag }[] };

interface WorkoutQuickViewProps {
  workout: QuickViewWorkout | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function youtubeThumbnail(url: string | null): string | null {
  if (!url) return null;
  const match = url.match(
    /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([a-zA-Z0-9_-]{11})/
  );
  return match ? `https://img.youtube.com/vi/${match[1]}/hqdefault.jpg` : null;
}

export function WorkoutQuickView({
  workout,
  open,
  onOpenChange,
}: WorkoutQuickViewProps) {
  const thumb = workout ? youtubeThumbnail(workout.youtube_url) : null;

  return (
    <ResponsiveSheetDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={workout?.name ?? ""}
      description="Quick preview"
      icon={<Dumbbell className="h-5 w-5 text-primary" />}
      footer={
        workout && (
          <Button asChild className="w-full" size="lg">
            <Link href={`/workouts/${workout.id}`}>
              View full details
              <ArrowRight className="ml-1.5 h-4 w-4" />
            </Link>
          </Button>
        )
      }
    >
      {workout && (
        <div className="space-y-4">
          {/* Image / video thumbnail */}
          <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
            {thumb ? (
              <>
                <Image
                  src={thumb}
                  alt={workout.name}
                  fill
                  unoptimized
                  className="object-cover"
                  sizes="(max-width: 640px) 100vw, 28rem"
                />
                <span className="absolute bottom-2 right-2 flex h-7 w-7 items-center justify-center rounded-full bg-red-600/90">
                  <Youtube className="h-4 w-4 text-white" />
                </span>
              </>
            ) : (
              <div className="flex h-full items-center justify-center bg-gradient-to-br from-primary/5 to-primary/10">
                <Dumbbell className="h-12 w-12 text-primary/30" />
              </div>
            )}
          </div>

          {/* Tags + recommended scheme */}
          <div className="flex flex-wrap items-center gap-2">
            <MuscleTags tags={workout.workout_tags} max={6} />
            <SchemeTag sets={workout.default_sets} reps={workout.default_reps} />
          </div>

          {/* Description */}
          {workout.description ? (
            <p className="text-sm leading-relaxed text-muted-foreground">
              {workout.description}
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              No description yet.
            </p>
          )}
        </div>
      )}
    </ResponsiveSheetDrawer>
  );
}
