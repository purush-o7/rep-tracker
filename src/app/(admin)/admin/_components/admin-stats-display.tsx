"use client";

import { Users, Dumbbell, ClipboardList, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface AdminStatsDisplayProps {
  totalUsers: number;
  totalWorkouts: number;
  totalLogs: number;
  activeUsers: number;
}

export function AdminStatsDisplay({
  totalUsers,
  totalWorkouts,
  totalLogs,
  activeUsers,
}: AdminStatsDisplayProps) {
  const stats = [
    { title: "Total Users", value: totalUsers, icon: Users, suffix: "users" },
    {
      title: "Workouts",
      value: totalWorkouts,
      icon: Dumbbell,
      suffix: "in catalog",
    },
    {
      title: "Total Logs",
      value: totalLogs,
      icon: ClipboardList,
      suffix: "logged",
    },
    {
      title: "Active 7d",
      value: activeUsers,
      icon: Activity,
      suffix: "users",
    },
  ];

  return (
    <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <Card
          key={stat.title}
          className="animate-in fade-in slide-in-from-bottom-4 fill-mode-both"
          style={{
            animationDuration: "500ms",
            animationDelay: `${index * 100}ms`,
          }}
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
