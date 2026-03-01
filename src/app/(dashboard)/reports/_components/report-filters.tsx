"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/types";

interface ReportFiltersProps {
  tags: Tag[];
  workouts: { id: string; name: string }[];
  dateFrom: string;
  dateTo: string;
  selectedTag: string | null;
  selectedWorkout: string | null;
  onTagChange: (tagId: string | null) => void;
  onWorkoutChange: (workoutId: string | null) => void;
}

export function ReportFilters({
  tags,
  workouts,
  dateFrom,
  dateTo,
  selectedTag,
  selectedWorkout,
  onTagChange,
  onWorkoutChange,
}: ReportFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateFromValue = dateFrom
    ? new Date(dateFrom + "T00:00:00")
    : undefined;
  const dateToValue = dateTo ? new Date(dateTo + "T00:00:00") : undefined;

  const updateDateParam = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  const handleDateFromChange = (date: Date | undefined) => {
    updateDateParam(
      "dateFrom",
      date ? format(date, "yyyy-MM-dd") : undefined
    );
  };

  const handleDateToChange = (date: Date | undefined) => {
    updateDateParam(
      "dateTo",
      date ? format(date, "yyyy-MM-dd") : undefined
    );
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[160px] justify-start text-left font-normal",
                !dateFromValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateFromValue ? format(dateFromValue, "PP") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateFromValue}
              onSelect={handleDateFromChange}
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[160px] justify-start text-left font-normal",
                !dateToValue && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateToValue ? format(dateToValue, "PP") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateToValue}
              onSelect={handleDateToChange}
            />
          </PopoverContent>
        </Popover>
        <Select
          value={selectedWorkout ?? "all"}
          onValueChange={(v) => onWorkoutChange(v === "all" ? null : v)}
        >
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="All exercises" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All exercises</SelectItem>
            {workouts.map((w) => (
              <SelectItem key={w.id} value={w.id}>
                {w.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-wrap gap-1">
        <Badge
          variant={selectedTag === null ? "default" : "outline"}
          className="cursor-pointer"
          onClick={() => onTagChange(null)}
        >
          All
        </Badge>
        {tags.map((tag) => (
          <Badge
            key={tag.id}
            variant={selectedTag === tag.id ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => onTagChange(selectedTag === tag.id ? null : tag.id)}
          >
            {tag.name}
          </Badge>
        ))}
      </div>
    </div>
  );
}
