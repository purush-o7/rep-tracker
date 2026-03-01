"use client";

import { Bar, BarChart, XAxis, YAxis, Legend } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from "@/components/ui/chart";

interface MuscleGroupReportProps {
  data: { month: string; [key: string]: string | number }[];
  muscleGroups: string[];
}

const colors = [
  "var(--chart-1)",
  "var(--chart-2)",
  "var(--chart-3)",
  "var(--chart-4)",
  "var(--chart-5)",
];

export function MuscleGroupReport({ data, muscleGroups }: MuscleGroupReportProps) {
  const chartConfig = Object.fromEntries(
    muscleGroups.map((group, i) => [
      group,
      { label: group, color: colors[i % colors.length] },
    ])
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Muscle Group Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No data for the selected period
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <BarChart data={data}>
              <XAxis dataKey="month" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <ChartLegend content={<ChartLegendContent />} />
              {muscleGroups.map((group, i) => (
                <Bar
                  key={group}
                  dataKey={group}
                  stackId="a"
                  fill={colors[i % colors.length]}
                />
              ))}
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
