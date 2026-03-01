"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { WorkoutImageCarousel } from "./workout-image-carousel";
import { LogWorkoutDialog } from "../../_components/log-workout-dialog";
import type { WorkoutWithTags } from "@/lib/types";

function getYouTubeEmbedUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    let videoId: string | null = null;

    if (parsed.hostname.includes("youtube.com")) {
      videoId = parsed.searchParams.get("v");
    } else if (parsed.hostname === "youtu.be") {
      videoId = parsed.pathname.slice(1);
    }

    return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
  } catch {
    return null;
  }
}

interface WorkoutDetailProps {
  workout: WorkoutWithTags;
}

export function WorkoutDetail({ workout }: WorkoutDetailProps) {
  const [logOpen, setLogOpen] = useState(false);
  const embedUrl = workout.youtube_url
    ? getYouTubeEmbedUrl(workout.youtube_url)
    : null;

  return (
    <div className="space-y-6">
      <WorkoutImageCarousel images={workout.workout_images ?? []} />

      <div className="space-y-4">
        <h1 className="text-3xl font-bold">{workout.name}</h1>
        <div className="flex flex-wrap gap-2">
          {workout.workout_tags.map((wt) => (
            <Badge key={wt.tag_id} variant="secondary">
              {wt.tags.name}
            </Badge>
          ))}
        </div>
        {workout.description && (
          <p className="text-muted-foreground leading-relaxed">
            {workout.description}
          </p>
        )}
        <Button
          size="lg"
          className="w-full sm:w-auto"
          onClick={() => setLogOpen(true)}
        >
          Log This Workout
        </Button>
      </div>

      {embedUrl && (
        <>
          <Separator />
          <div className="space-y-3">
            <h2 className="text-xl font-semibold">How to Perform</h2>
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <iframe
                src={embedUrl}
                title={`${workout.name} tutorial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </div>
        </>
      )}

      <LogWorkoutDialog
        workout={workout}
        open={logOpen}
        onOpenChange={setLogOpen}
      />
    </div>
  );
}
