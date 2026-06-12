"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Scale, Loader2, Target } from "lucide-react";
import { toast } from "sonner";
import { Line, LineChart, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { logBodyWeight } from "../actions";

interface WeightGoalCardClientProps {
  profile: {
    weight_kg: number | null;
    goal_weight_kg: number | null;
    goal_type: "gain" | "lose" | null;
    goal_start_weight_kg: number | null;
  };
  logs: { log_date: string; weight_kg: number }[];
}

const chartConfig = {
  weight_kg: {
    label: "Weight (kg)",
    color: "var(--chart-2)",
  },
};

export function WeightGoalCardClient({
  profile,
  logs,
}: WeightGoalCardClientProps) {
  const router = useRouter();
  const [input, setInput] = useState("");
  const [isPending, startTransition] = useTransition();

  const current =
    logs.length > 0 ? logs[logs.length - 1].weight_kg : profile.weight_kg;

  const hasGoal = !!profile.goal_weight_kg && !!profile.goal_type;
  const start = profile.goal_start_weight_kg ?? profile.weight_kg ?? current;

  let pct = 0;
  let changed = 0;
  let toGo = 0;
  if (hasGoal && current != null && start != null) {
    const isGain = profile.goal_type === "gain";
    changed = isGain ? current - start : start - current;
    const total = Math.abs(profile.goal_weight_kg! - start);
    pct = total > 0 ? Math.min(100, Math.max(0, (changed / total) * 100)) : 0;
    toGo = Math.max(
      0,
      isGain ? profile.goal_weight_kg! - current : current - profile.goal_weight_kg!
    );
  }

  const handleSave = () => {
    const value = parseFloat(input);
    if (!value || value <= 0 || value >= 500) {
      toast.error("Enter a valid weight");
      return;
    }
    startTransition(async () => {
      const result = await logBodyWeight(value);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(`${value} kg logged!`);
        setInput("");
        router.refresh();
      }
    });
  };

  const chartData = logs.map((l) => ({
    date: new Date(l.log_date + "T00:00:00").toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    }),
    weight_kg: l.weight_kg,
  }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Scale className="h-4 w-4 text-primary" />
            Body Weight
          </CardTitle>
          {!hasGoal && (
            <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
              <Link href="/settings">
                <Target className="mr-1 h-3.5 w-3.5" />
                Set a goal
              </Link>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Quick log */}
        <div className="flex gap-2">
          <Input
            type="number"
            inputMode="decimal"
            step={0.1}
            min={20}
            max={499}
            placeholder={current ? `${current}` : "kg"}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="h-11 text-base md:text-sm"
          />
          <Button
            onClick={handleSave}
            disabled={isPending || !input}
            className="h-11 shrink-0"
          >
            {isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              "Log weight"
            )}
          </Button>
        </div>

        {/* Goal progress */}
        {hasGoal && current != null && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>
                {profile.goal_type === "gain" ? "Gaining" : "Losing"} &middot;{" "}
                {changed >= 0 ? "+" : ""}
                {changed.toFixed(1)} kg
              </span>
              <span>{pct.toFixed(0)}% to goal</span>
            </div>
            <Progress value={pct} className="h-2" />
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-sm font-semibold">{start?.toFixed(1)}</p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Start kg
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-sm font-semibold text-primary">
                  {current.toFixed(1)}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Current
                </p>
              </div>
              <div className="rounded-lg bg-muted/50 p-2">
                <p className="text-sm font-semibold">
                  {profile.goal_weight_kg!.toFixed(1)}
                </p>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                  Target &middot; {toGo.toFixed(1)} to go
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Trend */}
        {chartData.length >= 2 ? (
          <ChartContainer config={chartConfig} className="h-[140px] w-full">
            <LineChart data={chartData}>
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                fontSize={10}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={["dataMin - 1", "dataMax + 1"]}
                tickLine={false}
                axisLine={false}
                fontSize={10}
                width={32}
                tickFormatter={(v: number) => v.toFixed(0)}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="weight_kg"
                stroke="var(--color-weight_kg)"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ChartContainer>
        ) : (
          <p className="text-center text-xs text-muted-foreground">
            Log your weight daily to see the trend here.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
