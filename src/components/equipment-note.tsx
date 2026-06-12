"use client";

import { useState } from "react";
import { Settings2, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getWorkoutPref, saveWorkoutPref } from "@/app/(dashboard)/workouts/actions";

interface EquipmentNoteProps {
  workoutId: string | null;
  enabled: boolean;
}

/**
 * Sticky per-exercise equipment note (seat height, grip, pin...).
 * Loads when the log sheet opens; saved value persists across sessions.
 */
export function EquipmentNote({ workoutId, enabled }: EquipmentNoteProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const { data: savedNote } = useQuery({
    queryKey: ["workout-pref", workoutId],
    queryFn: async () => {
      const result = await getWorkoutPref(workoutId!);
      if ("error" in result && result.error) throw new Error(result.error);
      return result.data ?? "";
    },
    enabled: enabled && !!workoutId,
    staleTime: 60_000,
  });

  if (savedNote === undefined) return null;

  const value = draft ?? savedNote;
  const dirty = draft !== null && draft !== savedNote;

  const handleSave = async () => {
    if (!workoutId || !dirty) return;
    setSaving(true);
    const result = await saveWorkoutPref(workoutId, value);
    setSaving(false);
    if (result.error) {
      toast.error(result.error);
    } else {
      queryClient.setQueryData(["workout-pref", workoutId], value.trim());
      setDraft(null);
      toast.success("Equipment note saved");
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Settings2 className="h-4 w-4 shrink-0 text-muted-foreground" />
      <Input
        placeholder="Equipment note — seat 4, grip narrow, pin 12..."
        value={value}
        onChange={(e) => setDraft(e.target.value)}
        maxLength={300}
        className="h-9 flex-1 text-sm"
      />
      {dirty && (
        <Button
          type="button"
          size="icon"
          variant="outline"
          className="h-9 w-9 shrink-0"
          onClick={handleSave}
          disabled={saving}
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Check className="h-4 w-4" />
          )}
        </Button>
      )}
    </div>
  );
}
