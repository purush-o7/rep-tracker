"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import type { Tag } from "@/lib/types";

interface TagSelectProps {
  tags: Tag[];
  selected: string[];
  onChange: (ids: string[]) => void;
}

export function TagSelect({ tags, selected, onChange }: TagSelectProps) {
  const toggle = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter((s) => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {selected.map((id) => {
          const tag = tags.find((t) => t.id === id);
          return (
            <Badge key={id} variant="secondary" className="gap-1">
              {tag?.name ?? id}
              <Button
                variant="ghost"
                size="icon"
                className="h-3 w-3 p-0"
                onClick={() => toggle(id)}
              >
                <X className="h-3 w-3" />
              </Button>
            </Badge>
          );
        })}
      </div>
      <div className="flex flex-wrap gap-1">
        {tags
          .filter((t) => !selected.includes(t.id))
          .map((tag) => (
            <Badge
              key={tag.id}
              variant="outline"
              className="cursor-pointer hover:bg-accent"
              onClick={() => toggle(tag.id)}
            >
              + {tag.name}
            </Badge>
          ))}
      </div>
    </div>
  );
}
