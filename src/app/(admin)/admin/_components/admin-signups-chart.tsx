"use client";

import { Area, AreaChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface AdminSignupsChartProps {
  data: { date: string; count: number }[];
}

const chartConfig = {
  count: {
    label: "Signups",
    color: "var(--chart-2)",
  },
};

export function AdminSignupsChart({ data }: AdminSignupsChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>New Signups (30d)</CardTitle>
      </CardHeader>
      <CardContent>
        {data.every((d) => d.count === 0) ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No signups in the last 30 days
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[200px] w-full">
            <AreaChart data={data}>
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis allowDecimals={false} tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="count"
                fill="var(--color-count)"
                fillOpacity={0.3}
                stroke="var(--color-count)"
              />
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
