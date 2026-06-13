"use client";

import { useState, useTransition } from "react";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ResponsiveSheetDrawer } from "@/components/responsive-sheet-drawer";
import { cn } from "@/lib/utils";
import { createUserWorkout } from "../actions";
import type { Tag } from "@/lib/types";

interface AddCustomWorkoutDialogProps {
  tags: Tag[];
}

export function AddCustomWorkoutDialog({ tags }: AddCustomWorkoutDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isPending, startTransition] = useTransition();

  const reset = () => {
    setName("");
    setDescription("");
    setYoutubeUrl("");
    setSelectedTags([]);
  };

  const toggleTag = (id: string) =>
    setSelectedTags((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );

  const handleSubmit = () => {
    if (name.trim().length < 2) {
      toast.error("Enter a workout name");
      return;
    }
    startTransition(async () => {
      const result = await createUserWorkout({
        name,
        description: description || undefined,
        youtube_url: youtubeUrl || undefined,
        tag_ids: selectedTags,
      });
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else {
        toast.success("Workout added");
        reset();
        setOpen(false);
        router.refresh();
      }
    });
  };

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 h-4 w-4" />
        New Workout
      </Button>

      <ResponsiveSheetDrawer
        open={open}
        onOpenChange={(o) => {
          if (!o) reset();
          setOpen(o);
        }}
        title="New Workout"
        description="Add a custom exercise to the catalog"
        icon={<Plus className="h-5 w-5 text-primary" />}
        footer={
          <Button
            className="w-full"
            size="lg"
            onClick={handleSubmit}
            disabled={isPending}
          >
            {isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adding...
              </>
            ) : (
              "Add Workout"
            )}
          </Button>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="cw-name">Name</Label>
            <Input
              id="cw-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Cable Y-Raise"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cw-desc">Description (optional)</Label>
            <Textarea
              id="cw-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="How it's performed..."
              rows={3}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cw-yt">YouTube link (optional)</Label>
            <Input
              id="cw-yt"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="https://youtube.com/watch?v=..."
              inputMode="url"
            />
          </div>
          <div className="space-y-2">
            <Label>Muscle groups</Label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map((tag) => {
                const active = selectedTags.includes(tag.id);
                return (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => toggleTag(tag.id)}
                    className={cn(
                      "rounded-full border px-2.5 py-1 text-xs font-medium capitalize transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {tag.name.replace(/_/g, " ")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </ResponsiveSheetDrawer>
    </>
  );
}
