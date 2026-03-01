"use client";

import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import type { Tag } from "@/lib/types";

interface WorkoutSearchProps {
  search: string;
  onSearchChange: (value: string) => void;
  tags: Tag[];
  selectedTag: string | null;
  onTagChange: (tagId: string | null) => void;
}

export function WorkoutSearch({
  search,
  onSearchChange,
  tags,
  selectedTag,
  onTagChange,
}: WorkoutSearchProps) {
  return (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search workouts..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-9"
        />
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
