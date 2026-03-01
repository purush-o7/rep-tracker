"use client";

import { Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ProgressChartProps {
  data: { date: string; maxWeight: number }[];
  exerciseName: string;
}

const chartConfig = {
  maxWeight: {
    label: "Max Weight (kg)",
    color: "var(--chart-1)",
  },
};

export function ProgressChart({ data, exerciseName }: ProgressChartProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {exerciseName ? `${exerciseName} - Weight Progression` : "Weight Progression"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Select an exercise to see progression
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[300px] w-full">
            <LineChart data={data}>
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="maxWeight"
                stroke="var(--color-maxWeight)"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
