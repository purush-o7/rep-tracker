"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Copy, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { copyRoutine } from "../actions";

export function CopyRoutineButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleCopy = () => {
    startTransition(async () => {
      const result = await copyRoutine(groupId);
      if ("error" in result && result.error) {
        toast.error(result.error);
      } else if ("data" in result && result.data) {
        toast.success("Copied to your routines");
        router.push(`/routines/${result.data.id}/edit`);
      }
    });
  };

  return (
    <Button size="sm" onClick={handleCopy} disabled={isPending}>
      {isPending ? (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      ) : (
        <Copy className="mr-2 h-4 w-4" />
      )}
      Copy to my routines
    </Button>
  );
}
