"use client";

import { Activity, Calendar, Flame, Weight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  weeklyWorkouts: number;
  monthlyWorkouts: number;
  currentStreak: number;
  totalVolume: number;
}

export function StatsCards({
  weeklyWorkouts,
  monthlyWorkouts,
  currentStreak,
  totalVolume,
}: StatsCardsProps) {
  const stats = [
    {
      title: "This Week",
      value: weeklyWorkouts,
      icon: Calendar,
      suffix: "workouts",
    },
    {
      title: "This Month",
      value: monthlyWorkouts,
      icon: Activity,
      suffix: "workouts",
    },
    {
      title: "Current Streak",
      value: currentStreak,
      icon: Flame,
      suffix: "days",
    },
    {
      title: "Total Volume",
      value: totalVolume,
      icon: Weight,
      suffix: "kg",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <stat.icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stat.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{stat.suffix}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
