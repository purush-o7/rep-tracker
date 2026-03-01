"use client";

import { Line, LineChart, XAxis, YAxis } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";

interface ExerciseProgressProps {
  data: { date: string; volume: number }[];
  exerciseName: string;
}

const chartConfig = {
  volume: {
    label: "Volume (kg)",
    color: "var(--chart-5)",
  },
};

export function ExerciseProgress({ data, exerciseName }: ExerciseProgressProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {exerciseName ? `${exerciseName} - Volume Trend` : "Volume Trend"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Select an exercise to see volume trends
          </p>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <LineChart data={data}>
              <XAxis dataKey="date" tickLine={false} axisLine={false} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Line
                type="monotone"
                dataKey="volume"
                stroke="var(--color-volume)"
                strokeWidth={2}
                dot={{ r: 3 }}
              />
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
