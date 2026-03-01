"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface LogFiltersProps {
  dateFrom?: string;
  dateTo?: string;
}

export function LogFilters({ dateFrom, dateTo }: LogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const dateFromValue = dateFrom ? new Date(dateFrom + "T00:00:00") : undefined;
  const dateToValue = dateTo ? new Date(dateTo + "T00:00:00") : undefined;

  const updateParams = (key: string, value: string | undefined) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page"); // reset to page 1 on filter change
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  const handleDateFromChange = (date: Date | undefined) => {
    updateParams(
      "dateFrom",
      date ? format(date, "yyyy-MM-dd") : undefined
    );
  };

  const handleDateToChange = (date: Date | undefined) => {
    updateParams(
      "dateTo",
      date ? format(date, "yyyy-MM-dd") : undefined
    );
  };

  const handleClear = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("dateFrom");
    params.delete("dateTo");
    params.delete("page");
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  return (
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
      {(dateFrom || dateTo) && (
        <Button variant="ghost" onClick={handleClear}>
          Clear
        </Button>
      )}
    </div>
  );
}
