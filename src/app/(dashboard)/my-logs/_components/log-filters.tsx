"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { CalendarIcon, Search, X } from "lucide-react";
import { format, startOfWeek, startOfMonth, subDays } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
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
import { useDebounce } from "@/hooks/use-debounce";
import { cn } from "@/lib/utils";
import type { Tag } from "@/lib/types";

interface LogFiltersProps {
  dateFrom?: string;
  dateTo?: string;
  searchQuery?: string;
  activeTag?: string;
  tags: Tag[];
}

export function LogFilters({
  dateFrom,
  dateTo,
  searchQuery,
  activeTag,
  tags,
}: LogFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchQuery ?? "");
  const debouncedSearch = useDebounce(search, 350);

  const dateFromValue = dateFrom ? new Date(dateFrom + "T00:00:00") : undefined;
  const dateToValue = dateTo ? new Date(dateTo + "T00:00:00") : undefined;

  const setParams = (updates: Record<string, string | undefined>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    params.delete("page");
    const qs = params.toString();
    router.push(`${pathname}${qs ? `?${qs}` : ""}`);
  };

  // Push debounced search to the URL
  useEffect(() => {
    const current = searchParams.get("q") ?? "";
    if (debouncedSearch === current) return;
    setParams({ q: debouncedSearch || undefined });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const applyRange = (from: Date) => {
    setParams({
      dateFrom: format(from, "yyyy-MM-dd"),
      dateTo: format(new Date(), "yyyy-MM-dd"),
    });
  };

  const hasFilters = !!(dateFrom || dateTo || searchQuery || activeTag);

  const clearAll = () => {
    setSearch("");
    setParams({
      dateFrom: undefined,
      dateTo: undefined,
      q: undefined,
      tag: undefined,
    });
  };

  return (
    <div className="space-y-2">
      {/* Search + muscle filter */}
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search exercises..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={activeTag ?? "all"}
          onValueChange={(v) => setParams({ tag: v === "all" ? undefined : v })}
        >
          <SelectTrigger className="w-[130px] shrink-0 capitalize">
            <SelectValue placeholder="Muscle" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All muscles</SelectItem>
            {tags.map((t) => (
              <SelectItem key={t.id} value={t.id} className="capitalize">
                {t.name.replace(/_/g, " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Quick ranges + date pickers */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyRange(startOfWeek(new Date(), { weekStartsOn: 1 }))}
          >
            Week
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyRange(startOfMonth(new Date()))}
          >
            Month
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => applyRange(subDays(new Date(), 30))}
          >
            30d
          </Button>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(!dateFromValue && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-1.5 h-4 w-4" />
              {dateFromValue ? format(dateFromValue, "d MMM") : "From"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateFromValue}
              onSelect={(d) =>
                setParams({ dateFrom: d ? format(d, "yyyy-MM-dd") : undefined })
              }
            />
          </PopoverContent>
        </Popover>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              className={cn(!dateToValue && "text-muted-foreground")}
            >
              <CalendarIcon className="mr-1.5 h-4 w-4" />
              {dateToValue ? format(dateToValue, "d MMM") : "To"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dateToValue}
              onSelect={(d) =>
                setParams({ dateTo: d ? format(d, "yyyy-MM-dd") : undefined })
              }
            />
          </PopoverContent>
        </Popover>

        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={clearAll}>
            <X className="mr-1 h-3.5 w-3.5" />
            Clear
          </Button>
        )}
      </div>
    </div>
  );
}
