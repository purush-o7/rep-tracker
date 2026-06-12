"use client";

import { History } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { getLastSession } from "@/app/(dashboard)/workouts/actions";
import type { LastSession } from "@/lib/types";

interface LastSessionRefProps {
  workoutId: string | null;
  enabled: boolean;
  /** Called when the user taps "Use" to prefill the set inputs */
  onApply?: (session: LastSession) => void;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
}

export function LastSessionRef({ workoutId, enabled, onApply }: LastSessionRefProps) {
  const { data, isLoading } = useQuery({
    queryKey: ["last-session", workoutId],
    queryFn: async () => {
      const result = await getLastSession(workoutId!);
      if ("error" in result && result.error) throw new Error(result.error);
      return result.data ?? null;
    },
    enabled: enabled && !!workoutId,
    staleTime: 60_000,
  });

  if (isLoading) {
    return <Skeleton className="h-16 w-full rounded-lg" />;
  }

  if (!data) return null;

  return (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
          <History className="h-3.5 w-3.5" />
          Last session &middot; {formatDate(data.performed_at)}
        </div>
        {onApply && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-primary"
            onClick={() => onApply(data)}
          >
            Use
          </Button>
        )}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {data.sets.map((s) => (
          <span
            key={s.set_number}
            className="rounded-md border bg-background px-2 py-1 font-mono text-xs text-muted-foreground"
          >
            {s.set_number}: {s.reps} &times; {s.weight_kg} kg
          </span>
        ))}
      </div>
    </div>
  );
}
