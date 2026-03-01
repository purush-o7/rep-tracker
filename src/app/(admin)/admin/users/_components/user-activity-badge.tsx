"use client";

import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface UserActivityBadgeProps {
  lastWorkout: string | null;
  totalWorkouts: number;
  memberSince: string;
}

export function UserActivityBadge({
  lastWorkout,
  totalWorkouts,
  memberSince,
}: UserActivityBadgeProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <Badge variant="outline">
        {totalWorkouts} workout{totalWorkouts !== 1 ? "s" : ""}
      </Badge>
      <Badge variant="outline">
        Joined {format(new Date(memberSince), "PP")}
      </Badge>
      {lastWorkout && (
        <Badge variant="secondary">
          Last: {format(new Date(lastWorkout), "PP")}
        </Badge>
      )}
    </div>
  );
}
