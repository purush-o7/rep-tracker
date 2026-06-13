import { startOfWeek } from "date-fns";
import { Check, Target } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WeeklyMuscleCoverageProps {
  userId: string;
}

export async function WeeklyMuscleCoverage({
  userId,
}: WeeklyMuscleCoverageProps) {
  const supabase = await createClient();
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const [tagsRes, logsRes] = await Promise.all([
    supabase.from("tags").select("name").order("name"),
    supabase
      .from("workout_logs")
      .select("workouts(workout_tags(tags(name)))")
      .eq("user_id", userId)
      .gte("performed_at", weekStart.toISOString()),
  ]);

  const allTags = (tagsRes.data ?? []).map((t) => t.name);

  // Count how many sessions hit each muscle group this week
  const counts: Record<string, number> = {};
  for (const name of allTags) counts[name] = 0;
  for (const log of logsRes.data ?? []) {
    const workout = log.workouts as unknown as {
      workout_tags: { tags: { name: string } | null }[];
    } | null;
    for (const wt of workout?.workout_tags ?? []) {
      const name = wt.tags?.name;
      if (name && name in counts) counts[name] += 1;
    }
  }

  const trained = allTags
    .filter((t) => counts[t] > 0)
    .sort((a, b) => counts[b] - counts[a]);
  const remaining = allTags.filter((t) => counts[t] === 0).sort();

  const total = allTags.length;
  const hit = trained.length;
  const pct = total > 0 ? Math.round((hit / total) * 100) : 0;

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Target className="h-4 w-4 text-primary" />
            Muscle Coverage · This Week
          </CardTitle>
          <span className="text-sm font-semibold">
            {hit}
            <span className="text-muted-foreground">/{total} groups</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* progress bar */}
        <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>

        {/* Still to hit — emphasized */}
        {remaining.length > 0 ? (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Still to hit
            </p>
            <div className="flex flex-wrap gap-1.5">
              {remaining.map((name) => (
                <span
                  key={name}
                  className="rounded-full border border-dashed border-amber-500/40 bg-amber-500/5 px-2.5 py-1 text-xs font-medium capitalize text-amber-600 dark:text-amber-400"
                >
                  {name.replace(/_/g, " ")}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <p className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
            <Check className="h-4 w-4" />
            Every muscle group trained this week — full coverage!
          </p>
        )}

        {/* Trained */}
        {trained.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Trained
            </p>
            <div className="flex flex-wrap gap-1.5">
              {trained.map((name) => (
                <span
                  key={name}
                  className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium capitalize text-primary"
                >
                  <Check className="h-3 w-3" />
                  {name.replace(/_/g, " ")}
                  {counts[name] > 1 && (
                    <span className="text-primary/60">×{counts[name]}</span>
                  )}
                </span>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
