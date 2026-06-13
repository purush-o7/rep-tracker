import { format } from "date-fns";
import {
  Activity,
  Dumbbell,
  Trophy,
  TrendingUp,
  Timer,
  MapPin,
  CalendarClock,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDuration, formatDistance } from "@/lib/set-entry";
import type { LogType } from "@/lib/types";
import type { WorkoutStats } from "./types";

interface WorkoutStatsPanelProps {
  logType: LogType;
  stats: WorkoutStats | null;
}

interface StatItem {
  label: string;
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  highlight?: boolean;
}

export function WorkoutStatsPanel({ logType, stats }: WorkoutStatsPanelProps) {
  if (!stats) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Your Stats</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center gap-2 py-6 text-center text-muted-foreground">
            <Dumbbell className="h-8 w-8 opacity-40" />
            <p className="text-sm">No history yet</p>
            <p className="text-xs">Log this exercise to start tracking progress.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const items: StatItem[] = [
    { label: "Sessions", value: String(stats.totalSessions), icon: Activity },
  ];

  if (logType === "weight_reps") {
    items.push(
      {
        label: "Best set",
        value: stats.bestWeight
          ? `${stats.bestWeight} kg${stats.bestWeightReps ? ` × ${stats.bestWeightReps}` : ""}`
          : "—",
        icon: Dumbbell,
        highlight: true,
      },
      {
        label: "Est. 1 rep max",
        value: stats.best1RM ? `${stats.best1RM} kg` : "—",
        icon: TrendingUp,
      },
      {
        label: "Best volume",
        value: stats.bestVolume
          ? `${stats.bestVolume.toLocaleString()} kg`
          : "—",
        icon: Activity,
      }
    );
  } else if (logType === "duration") {
    items.push({
      label: "Longest hold",
      value: stats.bestDuration ? formatDuration(stats.bestDuration) : "—",
      icon: Timer,
      highlight: true,
    });
  } else if (logType === "distance") {
    items.push({
      label: "Longest distance",
      value: stats.bestDistance ? formatDistance(stats.bestDistance) : "—",
      icon: MapPin,
      highlight: true,
    });
  }

  items.push(
    { label: "Personal records", value: String(stats.prCount), icon: Trophy },
    {
      label: "Last performed",
      value: format(new Date(stats.lastDate), "MMM d, yyyy"),
      icon: CalendarClock,
    }
  );

  return (
    <Card className="lg:sticky lg:top-4">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Your Stats</CardTitle>
      </CardHeader>
      <CardContent className="space-y-1">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.label}
              className="flex items-center justify-between rounded-lg px-2 py-2.5 odd:bg-muted/40"
            >
              <span className="flex items-center gap-2 text-sm text-muted-foreground">
                <Icon className="h-4 w-4" />
                {item.label}
              </span>
              <span
                className={
                  item.highlight
                    ? "text-base font-bold text-primary"
                    : "text-sm font-semibold"
                }
              >
                {item.value}
              </span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
