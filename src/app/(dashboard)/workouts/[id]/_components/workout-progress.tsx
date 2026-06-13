"use client";

import { format } from "date-fns";
import {
  Area,
  AreaChart,
  Line,
  LineChart,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { TrendingUp, Trophy } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatDuration, formatDistance } from "@/lib/set-entry";
import type { LogType } from "@/lib/types";
import type { ProgressionPoint, WorkoutStats } from "./types";

interface WorkoutProgressProps {
  logType: LogType;
  points: ProgressionPoint[];
  stats: WorkoutStats | null;
}

const weightConfig = { maxWeight: { label: "Max weight (kg)", color: "var(--chart-1)" } };
const oneRmConfig = { est1RM: { label: "Est. 1RM (kg)", color: "var(--chart-2)" } };
const volumeConfig = { volume: { label: "Volume (kg)", color: "var(--chart-5)" } };
const durationConfig = { maxDuration: { label: "Best hold (s)", color: "var(--chart-3)" } };
const distanceConfig = { totalDistance: { label: "Distance (m)", color: "var(--chart-4)" } };

export function WorkoutProgress({ logType, points, stats }: WorkoutProgressProps) {
  if (!stats || points.length === 0) {
    return (
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 text-xl font-semibold">
          <TrendingUp className="h-5 w-5" />
          Your Progress
        </h2>
        <Card>
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            Log this exercise a few times and your progression charts will appear here.
          </CardContent>
        </Card>
      </section>
    );
  }

  // Recent sessions, newest first
  const recent = [...points].reverse().slice(0, 8);

  const topSet = (p: ProgressionPoint) => {
    if (logType === "duration") return formatDuration(p.maxDuration);
    if (logType === "distance") return formatDistance(p.totalDistance);
    return p.maxWeight
      ? `${p.maxWeight} kg${p.topReps ? ` × ${p.topReps}` : ""}`
      : "—";
  };

  const metricHeader =
    logType === "duration"
      ? "Best hold"
      : logType === "distance"
        ? "Distance"
        : "Top set";

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 text-xl font-semibold">
        <TrendingUp className="h-5 w-5" />
        Your Progress
      </h2>

      {/* Charts */}
      {logType === "weight_reps" && (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Weight progression</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={weightConfig} className="h-[260px] w-full">
                <LineChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} width={36} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line
                    type="monotone"
                    dataKey="maxWeight"
                    stroke="var(--color-maxWeight)"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="est1RM"
                    stroke="var(--color-est1RM)"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Solid: heaviest set &middot; Dashed: estimated 1-rep max
              </p>
            </CardContent>
          </Card>
          <Card className="lg:col-span-1">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Volume per session</CardTitle>
            </CardHeader>
            <CardContent>
              <ChartContainer config={volumeConfig} className="h-[260px] w-full">
                <AreaChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                  <YAxis tickLine={false} axisLine={false} width={40} fontSize={11} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area
                    type="monotone"
                    dataKey="volume"
                    stroke="var(--color-volume)"
                    fill="var(--color-volume)"
                    fillOpacity={0.2}
                    strokeWidth={2}
                  />
                </AreaChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </div>
      )}

      {logType === "duration" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Best hold per session</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={durationConfig} className="h-[260px] w-full">
              <LineChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={40}
                  fontSize={11}
                  tickFormatter={(v: number) => formatDuration(v)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Line
                  type="monotone"
                  dataKey="maxDuration"
                  stroke="var(--color-maxDuration)"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {logType === "distance" && (
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Distance per session</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartContainer config={distanceConfig} className="h-[260px] w-full">
              <AreaChart data={points} margin={{ left: 4, right: 8, top: 8 }}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="date" tickLine={false} axisLine={false} fontSize={11} />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  width={48}
                  fontSize={11}
                  tickFormatter={(v: number) => formatDistance(v)}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Area
                  type="monotone"
                  dataKey="totalDistance"
                  stroke="var(--color-totalDistance)"
                  fill="var(--color-totalDistance)"
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </CardContent>
        </Card>
      )}

      {/* Recent sessions */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Recent sessions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Sets</TableHead>
                <TableHead>{metricHeader}</TableHead>
                {logType === "weight_reps" && (
                  <TableHead className="text-right">Volume</TableHead>
                )}
                <TableHead className="w-8" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {recent.map((p) => (
                <TableRow key={p.isoDate}>
                  <TableCell className="font-medium">
                    {format(new Date(p.isoDate), "MMM d, yyyy")}
                  </TableCell>
                  <TableCell className="text-center">{p.setCount}</TableCell>
                  <TableCell>{topSet(p)}</TableCell>
                  {logType === "weight_reps" && (
                    <TableCell className="text-right">
                      {p.volume.toLocaleString()} kg
                    </TableCell>
                  )}
                  <TableCell>
                    {p.isPr && (
                      <Trophy
                        className="h-4 w-4 text-amber-500"
                        aria-label="Personal record"
                      />
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </section>
  );
}
