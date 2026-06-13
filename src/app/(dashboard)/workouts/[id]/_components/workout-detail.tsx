"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Dumbbell,
  Play,
  Plus,
  Info,
  CalendarPlus,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SchemeTag } from "@/components/scheme-tag";
import { WorkoutImageCarousel } from "./workout-image-carousel";
import { WorkoutStatsPanel } from "./workout-stats-panel";
import { LogWorkoutDialog } from "../../_components/log-workout-dialog";
import { addWorkoutToPlan } from "../../../today/actions";
import type { WorkoutWithTags } from "@/lib/types";
import type { WorkoutStats } from "./types";

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
  stats: WorkoutStats | null;
}

export function WorkoutDetail({ workout, stats }: WorkoutDetailProps) {
  const [logOpen, setLogOpen] = useState(false);
  const [isAdding, startAdding] = useTransition();
  const embedUrl = workout.youtube_url
    ? getYouTubeEmbedUrl(workout.youtube_url)
    : null;
  const hasImages = (workout.workout_images ?? []).length > 0;

  const handleAddToToday = () => {
    startAdding(async () => {
      const result = await addWorkoutToPlan(workout.id);
      if ("error" in result) {
        toast.error(result.error);
      } else if (result.data) {
        toast.success("Added to today's plan");
      } else {
        toast.info("Already in today's plan");
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Back nav */}
      <Button variant="ghost" size="sm" asChild className="-ml-2">
        <Link href="/workouts">
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Back to Workouts
        </Link>
      </Button>

      {/* Title row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold sm:text-3xl">{workout.name}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {workout.workout_tags.map((wt) => (
              <Badge key={wt.tag_id} variant="secondary">
                {wt.tags.name}
              </Badge>
            ))}
            <SchemeTag
              sets={workout.default_sets}
              reps={workout.default_reps}
              pill
            />
          </div>
        </div>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="outline"
            size="lg"
            onClick={handleAddToToday}
            disabled={isAdding}
          >
            {isAdding ? (
              <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
            ) : (
              <CalendarPlus className="mr-1.5 h-4 w-4" />
            )}
            Add to Today
          </Button>
          <Button size="lg" onClick={() => setLogOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Log This Workout
          </Button>
        </div>
      </div>

      {/* Two-column: media + how-to on the left, stats on the right (desktop) */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* Video (constrained to a comfortable size, not full-bleed) */}
          {embedUrl ? (
            <Card className="overflow-hidden">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-red-500/10">
                    <Play className="h-3.5 w-3.5 text-red-500" />
                  </span>
                  How to Perform
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
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
          ) : hasImages ? (
            <WorkoutImageCarousel images={workout.workout_images ?? []} />
          ) : (
            <div className="flex h-48 items-center justify-center rounded-lg bg-gradient-to-br from-primary/5 to-primary/10">
              <Dumbbell className="h-16 w-16 text-primary/20" />
            </div>
          )}

          {/* Description / instructions */}
          {workout.description && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Info className="h-4 w-4 text-primary" />
                  About this exercise
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="leading-relaxed text-muted-foreground">
                  {workout.description}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Stats sidebar */}
        <div className="lg:col-span-1">
          <WorkoutStatsPanel logType={workout.log_type} stats={stats} />
        </div>
      </div>

      <LogWorkoutDialog
        workout={workout}
        open={logOpen}
        onOpenChange={setLogOpen}
      />
    </div>
  );
}
