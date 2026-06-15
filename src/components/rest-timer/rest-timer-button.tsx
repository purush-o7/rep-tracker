"use client";

import { Timer, BellRing } from "lucide-react";
import { cn } from "@/lib/utils";
import { useRestTimer, formatRemaining } from "./rest-timer-provider";
import { RestTimerPanel } from "./rest-timer-panel";

export function RestTimerButton() {
  const { status, remaining, setPanelOpen, dismiss } = useRestTimer();

  const onClick = () => {
    if (status === "completed") dismiss();
    else setPanelOpen(true);
  };

  return (
    <>
      <button
        type="button"
        onClick={onClick}
        aria-label="Rest timer"
        className={cn(
          "flex h-8 items-center gap-1.5 rounded-full px-2 text-sm font-medium transition-colors",
          status === "idle" &&
            "text-muted-foreground hover:bg-muted hover:text-foreground",
          status === "running" &&
            "bg-primary/10 text-primary hover:bg-primary/15",
          status === "completed" &&
            "animate-pulse bg-red-500/15 text-red-600 dark:text-red-400"
        )}
      >
        {status === "completed" ? (
          <BellRing className="h-4 w-4" />
        ) : (
          <Timer className={cn("h-4 w-4", status === "running" && "animate-pulse")} />
        )}
        {status === "running" && (
          <span className="tabular-nums">{formatRemaining(remaining)}</span>
        )}
      </button>
      <RestTimerPanel />
    </>
  );
}
