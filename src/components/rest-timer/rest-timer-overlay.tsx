"use client";

import { BellRing, Check, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRestTimer, formatRemaining } from "./rest-timer-provider";

export function RestTimerOverlay() {
  const { status, duration, start, dismiss } = useRestTimer();

  if (status !== "completed") return null;

  return (
    <div
      role="alertdialog"
      aria-label="Rest time complete"
      className="fixed inset-0 z-[80] flex items-center justify-center bg-red-950/70 p-6 backdrop-blur-sm animate-in fade-in"
      onClick={dismiss}
    >
      <div
        className="w-full max-w-xs rounded-2xl border border-red-500/30 bg-card p-6 text-center shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-2"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-red-500/15">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-red-500/20">
            <BellRing className="h-8 w-8 animate-bounce text-red-600 dark:text-red-400" />
          </span>
        </div>

        <h2 className="text-xl font-bold">Rest&apos;s over!</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {formatRemaining(duration)} rest complete — back to it.
        </p>

        <div className="mt-6 space-y-2">
          <Button className="w-full" size="lg" onClick={dismiss}>
            <Check className="mr-1.5 h-4 w-4" />
            Done
          </Button>
          <Button
            variant="outline"
            className="w-full"
            onClick={() => start(duration)}
          >
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Rest again
          </Button>
        </div>
      </div>
    </div>
  );
}
