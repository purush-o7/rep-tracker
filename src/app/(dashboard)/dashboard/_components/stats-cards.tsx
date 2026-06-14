"use client";

import { Activity, Calendar, Trophy, Weight } from "lucide-react";
import { Card } from "@/components/ui/card";

interface StatsCardsProps {
  weeklyWorkouts: number;
  monthlyWorkouts: number;
  longestStreak: number;
  totalVolume: number;
}

function compact(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}t`;
  return n.toLocaleString();
}

export function StatsCards({
  weeklyWorkouts,
  monthlyWorkouts,
  longestStreak,
  totalVolume,
}: StatsCardsProps) {
  const stats = [
    { title: "This week", value: String(weeklyWorkouts), suffix: "workouts", icon: Calendar, accent: "text-primary" },
    { title: "This month", value: String(monthlyWorkouts), suffix: "workouts", icon: Activity, accent: "text-primary" },
    { title: "Best streak", value: String(longestStreak), suffix: "days", icon: Trophy, accent: "text-amber-500" },
    { title: "Total volume", value: compact(totalVolume), suffix: "kg", icon: Weight, accent: "text-primary" },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card
            key={stat.title}
            className="animate-in fade-in slide-in-from-bottom-2 fill-mode-both p-3"
            style={{ animationDuration: "400ms", animationDelay: `${index * 60}ms` }}
          >
            <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground">
              <Icon className={`h-3.5 w-3.5 ${stat.accent}`} />
              <span className="truncate">{stat.title}</span>
            </div>
            <div className="mt-1.5 flex items-baseline gap-1">
              <span
                className="text-2xl font-bold leading-none sm:text-3xl"
                style={{ fontFamily: "var(--font-display), sans-serif" }}
              >
                {stat.value}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {stat.suffix}
              </span>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
