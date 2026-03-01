"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface AdminTagDistributionChartProps {
  data: { name: string; count: number }[];
}

const chartConfig = {
  count: {
    label: "Workouts",
    color: "var(--chart-4)",
  },
};

export function AdminTagDistributionChart({
  data,
}: AdminTagDistributionChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Tag Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data yet
          </p>
        ) : (
          <ChartContainer
            config={chartConfig}
            className="mx-auto h-[300px] w-full"
          >
            <RadarChart data={data}>
              <PolarGrid />
              <PolarAngleAxis dataKey="name" />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Radar
                dataKey="count"
                fill="var(--color-count)"
                fillOpacity={0.5}
                stroke="var(--color-count)"
              />
            </RadarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
