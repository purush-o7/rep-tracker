"use client";

import type { ReactNode } from "react";
import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/search-input";
import type { Tag } from "@/lib/types";

interface WorkoutSearchProps {
  tags: Tag[];
  selectedTag: string | null;
  onTagChange: (tagId: string | null) => void;
  initialSearch: string;
  /** Rendered inline beside the search input (e.g. an "Add" button) */
  action?: ReactNode;
}

export function WorkoutSearch({
  tags,
  selectedTag,
  onTagChange,
  action,
}: WorkoutSearchProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex-1">
          <SearchInput placeholder="Search workouts..." />
        </div>
        {action}
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
