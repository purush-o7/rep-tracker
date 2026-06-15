"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  Check,
  Loader2,
  CloudAlert,
  Dumbbell,
  User,
  Users,
  Youtube,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SetInputRow } from "@/app/(dashboard)/workouts/_components/set-input-row";
import { MuscleTags } from "@/components/muscle-tags";
import { SchemeTag } from "@/components/scheme-tag";
import { YouTubeEmbed } from "@/components/youtube-embed";
import { saveSets, addWorkoutToPlan } from "../../../actions";
import { vibrate } from "@/lib/utils";
import {
  emptySet,
  toSetInputs,
  formatLoggedSet,
  type SetEntry,
} from "@/lib/set-entry";
import type { LogType, TaggedWorkout } from "@/lib/types";

export interface LogPerson {
  userId: string;
  label: string;
  isSelf: boolean;
  canEdit: boolean;
  canView: boolean;
  planItemId: string | null;
  initialSets: SetEntry[];
  initialNotes: string;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

function prMessage(pr: { type: string; value: number; previous: number }) {
  return pr.type === "weight"
    ? `🏆 New PR! ${pr.value} kg (was ${pr.previous} kg)`
    : `🏆 Rep PR! ${pr.value} reps at top weight (was ${pr.previous})`;
}

export function LogStation({
  workout,
  people,
}: {
  workout: TaggedWorkout;
  people: LogPerson[];
}) {
  const logType = workout.log_type as LogType;
  const partnerCount = people.filter((p) => !p.isSelf).length;

  return (
    <div className="space-y-4 pb-8">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Button asChild variant="ghost" size="icon" className="shrink-0">
          <Link href="/today">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-bold leading-tight">
            {workout.name}
          </h1>
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <MuscleTags tags={workout.workout_tags} max={4} />
            <SchemeTag
              sets={workout.default_sets}
              reps={workout.default_reps}
            />
          </div>
        </div>
      </div>

      {/* Description — detached from logging */}
      {workout.description && (
        <Card>
          <CardContent className="p-4">
            <p className="text-sm leading-relaxed text-muted-foreground">
              {workout.description}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Logging blocks — you, then partners */}
      <div className="space-y-3">
        {people.map((person) => (
          <LogBlock
            key={person.userId}
            person={person}
            workoutId={workout.id}
            logType={logType}
          />
        ))}
        {partnerCount === 0 && (
          <p className="px-1 text-xs text-muted-foreground">
            Partners who train this exercise today will show up here so you can
            log together.
          </p>
        )}
      </div>

      {/* Exercise video */}
      {workout.youtube_url && (
        <div className="space-y-2 pt-2">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <Youtube className="h-4 w-4 text-red-600" />
            How to perform
          </div>
          <YouTubeEmbed url={workout.youtube_url} title={workout.name} />
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: SaveStatus }) {
  if (status === "saving")
    return (
      <span className="flex items-center gap-1 text-xs text-muted-foreground">
        <Loader2 className="h-3 w-3 animate-spin" />
        Saving
      </span>
    );
  if (status === "saved")
    return (
      <span className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
        <Check className="h-3 w-3" />
        Saved
      </span>
    );
  if (status === "error")
    return (
      <span className="flex items-center gap-1 text-xs text-destructive">
        <CloudAlert className="h-3 w-3" />
        Retry pending
      </span>
    );
  return null;
}

function LogBlock({
  person,
  workoutId,
  logType,
}: {
  person: LogPerson;
  workoutId: string;
  logType: LogType;
}) {
  const router = useRouter();
  const [sets, setSets] = useState<SetEntry[]>(
    person.initialSets.length ? person.initialSets : [emptySet()]
  );
  const [notes, setNotes] = useState(person.initialNotes);
  const [status, setStatus] = useState<SaveStatus>("idle");
  const [adding, setAdding] = useState(false);
  const setsEndRef = useRef<HTMLDivElement>(null);
  const firstRender = useRef(true);

  // Debounced auto-save whenever sets or notes change.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!person.canEdit || !person.planItemId) return;

    const valid = toSetInputs(sets, logType);
    if (valid.length === 0) return; // nothing meaningful to save yet

    setStatus("saving");
    const handle = setTimeout(async () => {
      const res = await saveSets({
        plan_item_id: person.planItemId!,
        sets: valid,
        notes,
        for_user_id: person.isSelf ? undefined : person.userId,
      });
      if (!res || "error" in res) {
        setStatus("error");
        toast.error(res?.error ?? "Failed to save");
        return;
      }
      setStatus("saved");
      vibrate(30);
      if (res.pr) {
        vibrate([50, 50, 100]);
        toast.success(prMessage(res.pr), { duration: 6000 });
      }
    }, 900);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sets, notes]);

  const addSet = () => {
    setSets((prev) => [...prev, { ...(prev[prev.length - 1] ?? emptySet()) }]);
    requestAnimationFrame(() =>
      setsEndRef.current?.scrollIntoView({ block: "center", behavior: "smooth" })
    );
  };
  const removeSet = (index: number) =>
    setSets((prev) => prev.filter((_, i) => i !== index));
  const updateSet = (index: number, patch: Partial<SetEntry>) =>
    setSets((prev) => prev.map((s, i) => (i === index ? { ...s, ...patch } : s)));

  const handleAddToPlan = async () => {
    setAdding(true);
    const res = await addWorkoutToPlan(
      workoutId,
      person.isSelf ? undefined : person.userId
    );
    if ("error" in res && res.error) {
      toast.error(res.error);
      setAdding(false);
      return;
    }
    toast.success(`Added to ${person.isSelf ? "your" : `${person.label}'s`} plan`);
    router.refresh();
  };

  const Icon = person.isSelf ? User : Users;
  const validCount = toSetInputs(sets, logType).length;

  return (
    <Card className={person.isSelf ? "border-primary/30" : undefined}>
      <CardContent className="space-y-3 p-4">
        {/* Block header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10">
              <Icon className="h-3.5 w-3.5 text-primary" />
            </span>
            <span className="truncate text-sm font-semibold">{person.label}</span>
          </div>
          {person.canEdit && person.planItemId && <StatusBadge status={status} />}
        </div>

        {/* Not training this today */}
        {!person.planItemId ? (
          person.canEdit ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full border-dashed"
              onClick={handleAddToPlan}
              disabled={adding}
            >
              {adding ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Add to {person.isSelf ? "my" : `${person.label}'s`} plan
            </Button>
          ) : (
            <p className="text-xs text-muted-foreground">
              Not training this exercise today.
            </p>
          )
        ) : person.canEdit ? (
          /* Editable, auto-saving log */
          <>
            <div className="space-y-2">
              {sets.map((set, i) => (
                <SetInputRow
                  key={i}
                  index={i}
                  logType={logType}
                  entry={set}
                  onChange={(patch) => updateSet(i, patch)}
                  onRemove={() => removeSet(i)}
                  canRemove={sets.length > 1}
                />
              ))}
              <div ref={setsEndRef} />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={addSet}
              className="w-full border-dashed"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Set
            </Button>
            <Textarea
              placeholder="Notes (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
            <p className="text-center text-[11px] text-muted-foreground">
              {validCount} {validCount === 1 ? "set" : "sets"} · saved
              automatically
            </p>
          </>
        ) : (
          /* View-only: show their logged sets */
          <ReadOnlySets person={person} logType={logType} />
        )}
      </CardContent>
    </Card>
  );
}

function ReadOnlySets({
  person,
  logType,
}: {
  person: LogPerson;
  logType: LogType;
}) {
  if (person.initialSets.length === 0) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Dumbbell className="h-3.5 w-3.5" />
        No sets logged yet.
      </p>
    );
  }
  return (
    <div className="space-y-1">
      {person.initialSets.map((s, i) => (
        <div
          key={i}
          className="flex items-center gap-3 rounded-md bg-muted/40 px-3 py-1.5 text-sm"
        >
          <span className="w-5 text-center text-xs text-muted-foreground">
            {i + 1}
          </span>
          <span className="font-medium">
            {formatLoggedSet({
              reps: logType === "weight_reps" ? s.reps : null,
              weight_kg: s.weight_kg,
              duration_seconds: logType === "duration" ? s.duration_seconds : null,
              distance_m: logType === "distance" ? s.distance_m : null,
            })}
          </span>
        </div>
      ))}
    </div>
  );
}
