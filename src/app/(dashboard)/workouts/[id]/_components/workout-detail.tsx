"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Dumbbell, Play, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  const hasImages = (workout.workout_images ?? []).length > 0;

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <div
        className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
        style={{ animationDuration: "400ms" }}
      >
        <Button variant="ghost" size="sm" asChild className="-ml-2">
          <Link href="/workouts">
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Back to Workouts
          </Link>
        </Button>
      </div>

      {/* Hero section */}
      <div
        className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
        style={{ animationDuration: "500ms", animationDelay: "100ms" }}
      >
        {hasImages ? (
          <WorkoutImageCarousel images={workout.workout_images ?? []} />
        ) : (
          <div className="flex h-48 items-center justify-center rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
            <Dumbbell className="h-16 w-16 text-primary/20" />
          </div>
        )}
      </div>

      {/* Title + tags + CTA */}
      <div
        className="space-y-4 animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
        style={{ animationDuration: "500ms", animationDelay: "200ms" }}
      >
        <h1 className="text-3xl font-bold">{workout.name}</h1>

        {workout.workout_tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {workout.workout_tags.map((wt) => (
              <Badge key={wt.tag_id} variant="secondary">
                {wt.tags.name}
              </Badge>
            ))}
          </div>
        )}

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
          <Plus className="mr-1.5 h-4 w-4" />
          Log This Workout
        </Button>
      </div>

      {/* YouTube video */}
      {embedUrl && (
        <Card
          className="overflow-hidden animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
          style={{ animationDuration: "500ms", animationDelay: "300ms" }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
                <Play className="h-4 w-4 text-red-500" />
              </div>
              How to Perform
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative aspect-video overflow-hidden rounded-lg">
              <iframe
                src={embedUrl}
                title={`${workout.name} tutorial`}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="absolute inset-0 h-full w-full"
              />
            </div>
          </CardContent>
        </Card>
      )}

      <LogWorkoutDialog
        workout={workout}
        open={logOpen}
        onOpenChange={setLogOpen}
      />
    </div>
  );
}
