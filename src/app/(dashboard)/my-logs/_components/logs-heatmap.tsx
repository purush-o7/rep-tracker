import Link from "next/link";
import {
  startOfWeek,
  subWeeks,
  addWeeks,
  addDays,
  format,
  isAfter,
} from "date-fns";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface LogsHeatmapProps {
  userId: string;
  activePartner?: string;
}

const WEEKS = 13;
const dayKey = (d: Date) => format(d, "yyyy-MM-dd");

function level(count: number): number {
  if (count <= 0) return 0;
  if (count <= 1) return 1;
  if (count <= 2) return 2;
  if (count <= 4) return 3;
  return 4;
}

const LEVEL_STYLE: Record<number, React.CSSProperties> = {
  0: {},
  1: { backgroundColor: "var(--chart-1)", opacity: 0.3 },
  2: { backgroundColor: "var(--chart-1)", opacity: 0.55 },
  3: { backgroundColor: "var(--chart-1)", opacity: 0.8 },
  4: { backgroundColor: "var(--chart-1)", opacity: 1 },
};

export async function LogsHeatmap({ userId, activePartner }: LogsHeatmapProps) {
  const supabase = await createClient();
  const today = new Date();
  const gridStart = startOfWeek(subWeeks(today, WEEKS - 1), {
    weekStartsOn: 1,
  });

  const { data } = await supabase
    .from("workout_logs")
    .select("performed_at")
    .eq("user_id", userId)
    .gte("performed_at", gridStart.toISOString());

  // exercises logged per day
  const counts = new Map<string, number>();
  for (const l of data ?? []) {
    const k = l.performed_at.slice(0, 10);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }

  if ((data ?? []).length === 0) return null;

  const weeks = Array.from({ length: WEEKS }, (_, w) => {
    const weekStart = addWeeks(gridStart, w);
    return Array.from({ length: 7 }, (_, d) => addDays(weekStart, d));
  });

  const partnerQs = activePartner ? `&partner=${activePartner}` : "";

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Training activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="flex gap-1">
            {weeks.map((week, wi) => (
              <div key={wi} className="flex flex-col gap-1">
                {week.map((day) => {
                  const future = isAfter(day, today);
                  const key = dayKey(day);
                  const count = counts.get(key) ?? 0;
                  const lvl = level(count);
                  if (future) {
                    return <div key={key} className="h-3.5 w-3.5" />;
                  }
                  return (
                    <Link
                      key={key}
                      href={`/my-logs?dateFrom=${key}&dateTo=${key}${partnerQs}`}
                      title={`${format(day, "EEE, d MMM")} — ${count} ${
                        count === 1 ? "exercise" : "exercises"
                      }`}
                      className="h-3.5 w-3.5 rounded-sm bg-muted transition-transform hover:scale-110"
                      style={LEVEL_STYLE[lvl]}
                    />
                  );
                })}
              </div>
            ))}
          </div>
        </div>
        <div className="mt-2 flex items-center justify-end gap-1 text-[10px] text-muted-foreground">
          <span>Less</span>
          {[0, 1, 2, 3, 4].map((l) => (
            <span
              key={l}
              className="h-2.5 w-2.5 rounded-sm bg-muted"
              style={LEVEL_STYLE[l]}
            />
          ))}
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}

export function LogsHeatmapSkeleton() {
  return <Card className="h-[140px] animate-pulse" />;
}
