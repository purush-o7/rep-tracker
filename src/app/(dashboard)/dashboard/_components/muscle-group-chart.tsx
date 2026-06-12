"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { TrendingUp, TrendingDown } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface MuscleGroupChartProps {
  data: { muscle: string; count: number }[];
}

const chartConfig = {
  count: {
    label: "Workouts",
    color: "var(--chart-4)",
  },
};

export function MuscleGroupChart({ data }: MuscleGroupChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);
  const sorted = [...data].sort((a, b) => b.count - a.count);
  const most = sorted.filter((d) => d.count > 0).slice(0, 2);
  const least = [...sorted].reverse().slice(0, 3);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Muscle Balance · 30 days</CardTitle>
      </CardHeader>
      <CardContent>
        {total === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data yet
          </p>
        ) : (
          <>
            <ChartContainer config={chartConfig} className="mx-auto h-[260px] w-full">
              <RadarChart data={data}>
                <PolarGrid />
                <PolarAngleAxis dataKey="muscle" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Radar
                  dataKey="count"
                  fill="var(--color-count)"
                  fillOpacity={0.5}
                  stroke="var(--color-count)"
                />
              </RadarChart>
            </ChartContainer>
            <div className="mt-2 space-y-1 text-xs text-muted-foreground">
              {most.length > 0 && (
                <p className="flex items-center gap-1.5">
                  <TrendingUp className="h-3.5 w-3.5 text-green-500" />
                  Most trained:{" "}
                  <span className="font-medium text-foreground">
                    {most.map((m) => m.muscle).join(", ")}
                  </span>
                </p>
              )}
              <p className="flex items-center gap-1.5">
                <TrendingDown className="h-3.5 w-3.5 text-amber-500" />
                Needs attention:{" "}
                <span className="font-medium text-foreground">
                  {least.map((m) => `${m.muscle} (${m.count})`).join(", ")}
                </span>
              </p>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
