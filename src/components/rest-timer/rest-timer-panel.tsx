"use client";

import { Minus, Plus, Play, Square, RotateCcw, Timer } from "lucide-react";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetBody,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useRestTimer, formatRemaining } from "./rest-timer-provider";

const PRESETS = [
  { label: "1 min", seconds: 60 },
  { label: "2 min", seconds: 120 },
  { label: "3 min", seconds: 180 },
  { label: "5 min", seconds: 300 },
];

function CountdownRing({
  remaining,
  duration,
}: {
  remaining: number;
  duration: number;
}) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const frac = duration > 0 ? Math.min(1, Math.max(0, remaining / duration)) : 0;
  return (
    <div className="relative mx-auto h-40 w-40">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 120 120">
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="8"
          className="stroke-muted"
        />
        <circle
          cx="60"
          cy="60"
          r={r}
          fill="none"
          strokeWidth="8"
          strokeLinecap="round"
          className="stroke-primary transition-[stroke-dashoffset] duration-300 ease-linear"
          strokeDasharray={circ}
          strokeDashoffset={circ * (1 - frac)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-bold tabular-nums"
          style={{ fontFamily: "var(--font-display), sans-serif" }}
        >
          {formatRemaining(remaining)}
        </span>
        <span className="text-xs text-muted-foreground">remaining</span>
      </div>
    </div>
  );
}

function PanelBody() {
  const { status, remaining, duration, start, addSeconds, stop } =
    useRestTimer();

  if (status === "running") {
    return (
      <div className="space-y-5">
        <CountdownRing remaining={remaining} duration={duration} />

        <div className="flex items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => addSeconds(-15)}
          >
            <Minus className="mr-1 h-4 w-4" />
            15s
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="flex-1"
            onClick={() => addSeconds(15)}
          >
            <Plus className="mr-1 h-4 w-4" />
            15s
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="secondary" onClick={() => start(duration)}>
            <RotateCcw className="mr-1.5 h-4 w-4" />
            Restart
          </Button>
          <Button variant="destructive" onClick={stop}>
            <Square className="mr-1.5 h-4 w-4" />
            Stop
          </Button>
        </div>
      </div>
    );
  }

  // idle — pick a duration
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-2">
        {PRESETS.map((p) => (
          <Button
            key={p.seconds}
            variant="outline"
            className="h-16 flex-col gap-1 text-base font-semibold"
            onClick={() => start(p.seconds)}
          >
            <Timer className="h-5 w-5 text-primary" />
            {p.label}
          </Button>
        ))}
      </div>
      <p className="text-center text-xs text-muted-foreground">
        Tap a duration to start your rest timer
      </p>
    </div>
  );
}

export function RestTimerPanel() {
  const { panelOpen, setPanelOpen, status } = useRestTimer();
  const isMobile = useIsMobile();

  const title = status === "running" ? "Rest timer" : "Start rest timer";
  const description =
    status === "running"
      ? "Counting down — it keeps running as you move around the app."
      : "Quick presets between your sets.";

  // Mobile → centered dialog, desktop → side sheet
  if (isMobile) {
    return (
      <Dialog open={panelOpen} onOpenChange={setPanelOpen}>
        <DialogContent className="max-w-xs gap-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <Timer className="h-4 w-4 text-primary" />
              {title}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {description}
            </DialogDescription>
          </DialogHeader>
          <PanelBody />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
      <SheetContent className="sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Timer className="h-4 w-4 text-primary" />
            {title}
          </SheetTitle>
          <SheetDescription>{description}</SheetDescription>
        </SheetHeader>
        <SheetBody>
          <PanelBody />
        </SheetBody>
      </SheetContent>
    </Sheet>
  );
}
