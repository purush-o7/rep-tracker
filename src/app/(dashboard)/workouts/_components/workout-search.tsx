"use client";

import { Badge } from "@/components/ui/badge";
import { SearchInput } from "@/components/search-input";
import type { Tag } from "@/lib/types";

interface WorkoutSearchProps {
  tags: Tag[];
  selectedTag: string | null;
  onTagChange: (tagId: string | null) => void;
  initialSearch: string;
}

export function WorkoutSearch({
  tags,
  selectedTag,
  onTagChange,
}: WorkoutSearchProps) {
  return (
    <div className="space-y-3">
      <SearchInput placeholder="Search workouts..." />
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
