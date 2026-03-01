"use client";

import { Activity, Calendar, Trophy, Weight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface StatsCardsProps {
  weeklyWorkouts: number;
  monthlyWorkouts: number;
  longestStreak: number;
  totalVolume: number;
}

export function StatsCards({
  weeklyWorkouts,
  monthlyWorkouts,
  longestStreak,
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
      title: "Best Streak",
      value: longestStreak,
      icon: Trophy,
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
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
          style={{ animationDuration: "500ms", animationDelay: `${index * 100}ms` }}
        >
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <stat.icon className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              style={{ fontFamily: "var(--font-display), sans-serif" }}
            >
              {stat.value.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">{stat.suffix}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
