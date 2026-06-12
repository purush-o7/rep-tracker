"use client";

import { useState } from "react";
import { CalendarClock, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { setWeeklyScheduleDay } from "../actions";
import type { WeeklyScheduleEntry, WorkoutGroup } from "@/lib/types";

const REST = "rest";

// Monday-first display order; values are JS getDay() numbers
const DAYS = [
  { value: 1, label: "Mon" },
  { value: 2, label: "Tue" },
  { value: 3, label: "Wed" },
  { value: 4, label: "Thu" },
  { value: 5, label: "Fri" },
  { value: 6, label: "Sat" },
  { value: 0, label: "Sun" },
];

interface WeeklyScheduleCardProps {
  routines: Pick<WorkoutGroup, "id" | "name">[];
  schedule: WeeklyScheduleEntry[];
}

export function WeeklyScheduleCard({
  routines,
  schedule,
}: WeeklyScheduleCardProps) {
  const [byDay, setByDay] = useState<Record<number, string>>(() =>
    Object.fromEntries(schedule.map((s) => [s.day_of_week, s.group_id]))
  );
  const [savingDay, setSavingDay] = useState<number | null>(null);

  const todayDow = new Date().getDay();

  const handleChange = async (day: number, value: string) => {
    const previous = byDay[day];
    setByDay((prev) => {
      const next = { ...prev };
      if (value === REST) delete next[day];
      else next[day] = value;
      return next;
    });
    setSavingDay(day);

    const result = await setWeeklyScheduleDay(
      day,
      value === REST ? null : value
    );

    if (result.error) {
      toast.error(result.error);
      setByDay((prev) => {
        const next = { ...prev };
        if (previous) next[day] = previous;
        else delete next[day];
        return next;
      });
    }
    setSavingDay(null);
  };

  if (routines.length === 0) return null;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CalendarClock className="h-4 w-4 text-primary" />
          Weekly Schedule
        </CardTitle>
        <CardDescription>
          Assign a routine to each day — it shows up on your Today page.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {DAYS.map((day) => (
            <div key={day.value} className="flex items-center gap-3">
              <span
                className={`w-10 shrink-0 text-sm font-medium ${
                  day.value === todayDow
                    ? "text-primary"
                    : "text-muted-foreground"
                }`}
              >
                {day.label}
              </span>
              <Select
                value={byDay[day.value] ?? REST}
                onValueChange={(v) => handleChange(day.value, v)}
                disabled={savingDay === day.value}
              >
                <SelectTrigger className="h-10 flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={REST}>
                    <span className="text-muted-foreground">Rest day</span>
                  </SelectItem>
                  {routines.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {r.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {savingDay === day.value && (
                <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
