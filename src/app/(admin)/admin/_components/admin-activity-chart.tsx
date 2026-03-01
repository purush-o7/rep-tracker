"use client";

import { Bar, BarChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface AdminActivityChartProps {
  data: { date: string; count: number }[];
}

const chartConfig = {
  count: {
    label: "Workouts",
    color: "var(--chart-1)",
  },
};

export function AdminActivityChart({ data }: AdminActivityChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Daily Activity (14d)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.every((d) => d.count === 0) ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No activity in the last 14 days
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <BarChart data={data}>
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar
                dataKey="count"
                fill="var(--color-count)"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
